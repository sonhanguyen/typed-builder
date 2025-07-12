import { Task, TaskResult, Plan, SubTask, Stream, Emiter } from './task'
import { TaskQueue, DependencyTaskQueue } from './queue'
import { Socket } from 'socket.io-client'
import { Server as SocketIOServer } from 'socket.io'

export type Executor<
  In extends {} = {},
  Out = any,
  Event extends Task | Plan = Task | Plan,
  Signal extends TaskResult = TaskResult,
> = {
  type: string
  run(_: In): Promise<Out>
    & Partial<Channel<Signal, Event>>
}

export type Channel<In, Out> = Stream<Out> & Emiter<In>

export interface Agent extends Channel<
  Task | TaskResult,
  Task | TaskResult
> {
  readonly meta: { type: string }
  readonly id: string
}

export class AgentWorker implements Agent {
  readonly meta: { type: string }
  readonly id: string
  
  private resultEmitter?: (result: Task | TaskResult) => void
  private taskResults = new Map<string, TaskResult>()

  constructor(
    id: string,
    private executor: Executor,
    meta: { type: string },
  ) {
    this.id = id
    this.executor = executor
    this.meta = meta
  }

  on(listener: (result: Task | TaskResult) => void): void {
    this.resultEmitter = listener
  }

  emit(taskOrResult: Task | TaskResult): void {
    if (this.isTask(taskOrResult)) {
      this.processTask(taskOrResult)
    } else {
      // Handle TaskResult - this would be for forwarding results
      if (this.resultEmitter) {
        this.resultEmitter(taskOrResult)
      }
    }
  }

  private isTask(item: Task | TaskResult): item is Task {
    return 'executor' in item && 'params' in item
  }

  async processTask(task: Task): Promise<void> {
    const start = new Date()
    
    try {
      const response = await this.executor.run(task.params)
      
      // Check if response is a Plan
      if (this.isPlan(response)) {
        await this.executePlan(response)
        this.emitResult({
          result: { data: 'Plan executed' },
          start,
          end: new Date(),
          id: task.id
        })
        return
      }
      
      this.emitResult({
        result: { data: response },
        start,
        end: new Date(),
        id: task.id
      })
    } catch (error) {
      this.emitResult({
        result: { error },
        start,
        end: new Date(),
        id: task.id
      })
    }
  }

  private emitResult(result: TaskResult): void {
    this.taskResults.set(result.id, result)
    if (this.resultEmitter) {
      this.resultEmitter(result)
    }
  }

  private isPlan(data: any): data is Plan {
    return typeof data === 'object' && 'subtasks' in data
  }

  async executePlan(plan: Plan): Promise<void> {
    return new Promise((resolve) => {
      const planQueue = new DependencyTaskQueue()
      let streamEnded = false
      let activeStreams = 0

      const checkCompletion = () => {
        if (streamEnded && activeStreams === 0 && planQueue.isEmpty()) {
          resolve()
        }
      }

      const processItem = (item: SubTask | Plan) => {
        if (this.isSubTask(item)) {
          const resolvedSubtask: SubTask = {
            ...item,
            params: typeof item.params === 'function' 
              ? this.resolveParams(item)
              : item.params
          }
          
          planQueue.enqueue(resolvedSubtask)
          this.flushQueueToEmit(planQueue)
        } else {
          // Handle nested Plan
          activeStreams++
          item.subtasks.on((nestedItem) => {
            processItem(nestedItem)
          })
          activeStreams--
        }
        checkCompletion()
      }

      plan.subtasks.on((item) => {
        processItem(item)
      })

      setTimeout(() => {
        streamEnded = true
        checkCompletion()
      }, 0)
    })
  }

  private flushQueueToEmit(planQueue: DependencyTaskQueue): void {
    while (!planQueue.isEmpty()) {
      const task = planQueue.dequeue()
      if (task) {
        this.processTask(task)
      }
    }
  }

  private resolveParams(subtask: SubTask): any {
    if (typeof subtask.params !== 'function') {
      return subtask.params
    }

    const depResults = (subtask.dependencies || []).map(depId => {
      const result = this.taskResults.get(depId)
      return result?.result.data
    })

    return subtask.params(...depResults)
  }

  private isSubTask(item: SubTask | Plan): item is SubTask {
    return 'executor' in item
  }

  getTaskResult(taskId: string): TaskResult | undefined {
    return this.taskResults.get(taskId)
  }
}

export class AgentProxy implements Agent {
  readonly meta: { type: string }
  readonly id: string
  
  private socket: Socket
  private resultEmitter?: (result: Task | TaskResult) => void

  constructor(id: string, meta: { type: string }, socket: Socket) {
    this.id = id
    this.meta = meta
    this.socket = socket
    
    this.setupSocketListeners()
  }

  private setupSocketListeners(): void {
    // Listen for results from the worker
    this.socket.on('task-result', (result: TaskResult) => {
      if (this.resultEmitter) {
        this.resultEmitter(result)
      }
    })
    
    // Listen for tasks from the worker (if worker needs to emit tasks)
    this.socket.on('task', (task: Task) => {
      if (this.resultEmitter) {
        this.resultEmitter(task)
      }
    })
  }

  on(listener: (result: Task | TaskResult) => void): void {
    this.resultEmitter = listener
  }

  emit(taskOrResult: Task | TaskResult): void {
    if (this.isTask(taskOrResult)) {
      // Send task to worker
      this.socket.emit('task', taskOrResult)
    } else {
      // Send result to worker (if needed)
      this.socket.emit('task-result', taskOrResult)
    }
  }

  private isTask(item: Task | TaskResult): item is Task {
    return 'executor' in item && 'params' in item
  }
}

export class Supervisor {
  private router: Router
  private io: SocketIOServer
  private agentProxies = new Map<string, AgentProxy>()

  constructor(router: Router, io: SocketIOServer) {
    this.router = router
    this.io = io
    
    this.setupConnectionHandlers()
  }

  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('Worker connected:', socket.id)
      
      // Listen for worker registration
      socket.on('register-worker', (workerInfo: { id: string, meta: { type: string } }) => {
        console.log('Registering worker:', workerInfo)
        
        // Create AgentProxy for this worker
        const agentProxy = new AgentProxy(workerInfo.id, workerInfo.meta, socket)
        
        // Store the proxy
        this.agentProxies.set(workerInfo.id, agentProxy)
        
        // Register with router
        this.router.registerAgent(agentProxy)
        
        // Acknowledge registration
        socket.emit('registration-ack', { success: true })
      })
      
      socket.on('disconnect', () => {
        console.log('Worker disconnected:', socket.id)
        // TODO: Clean up agent proxy and unregister from router
      })
    })
  }

  getAgentProxy(id: string): AgentProxy | undefined {
    return this.agentProxies.get(id)
  }
}

export class Router {
  private agents = new Map<string, Agent>()
  private taskQueue: TaskQueue
  private taskResults = new Map<string, TaskResult>()
  private resultEmitter?: (result: TaskResult) => void

  constructor(taskQueue?: TaskQueue) {
    this.taskQueue = taskQueue || new DependencyTaskQueue()
  }

  registerAgent(agent: Agent): void {
    this.agents.set(agent.meta.type, agent)
    
    // Set up result listener
    agent.on((taskOrResult: Task | TaskResult) => {
      if (this.isTaskResult(taskOrResult)) {
        this.taskResults.set(taskOrResult.id, taskOrResult)
        
        // Mark as completed in task queue if it's a dependency queue
        if (this.taskQueue instanceof DependencyTaskQueue) {
          this.taskQueue.markCompleted(taskOrResult.id)
        }
        
        // Emit result to router listeners
        if (this.resultEmitter) {
          this.resultEmitter(taskOrResult)
        }
      }
      // Handle tasks if needed (for plan execution, etc.)
    })
  }

  private isTaskResult(item: Task | TaskResult): item is TaskResult {
    return 'result' in item && 'start' in item && 'end' in item
  }

  onResult(listener: (result: TaskResult) => void): void {
    this.resultEmitter = listener
  }

  enqueueTask(task: Task): void {
    this.taskQueue.enqueue(task)
    this.processNextTask()
  }

  private processNextTask(): void {
    const task = this.taskQueue.dequeue()
    if (!task) return

    const agent = this.agents.get(task.executor)
    if (!agent) {
      const error = new Error(`No agent found for executor: ${task.executor}`)
      const result: TaskResult = {
        result: { error },
        start: new Date(),
        end: new Date(),
        id: task.id
      }
      this.taskResults.set(task.id, result)
      if (this.resultEmitter) {
        this.resultEmitter(result)
      }
      return
    }

    agent.emit(task)
  }

  getTaskResult(taskId: string): TaskResult | undefined {
    return this.taskResults.get(taskId)
  }

  getTaskQueueSize(): number {
    return this.taskQueue.size()
  }

  isTaskQueueEmpty(): boolean {
    return this.taskQueue.isEmpty()
  }

  clearTaskQueue(): void {
    this.taskQueue.clear()
  }
}