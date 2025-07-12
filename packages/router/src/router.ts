import { Task, TaskResult, Agent } from '../../types'
import { TaskQueue, DependencyTaskQueue } from '../../queue'

export class Router {
  private agents = new Map<string, Agent>()
  private taskQueue: TaskQueue
  private taskResults = new Map<string, TaskResult>()
  private resultEmitter?: (result: TaskResult) => void

  constructor(taskQueue?: TaskQueue) {
    this.taskQueue = taskQueue || new DependencyTaskQueue()
  }

  registerAgent(agent: Agent): void {
    console.log(`Registering agent with type: ${agent.meta.type}`)
    this.agents.set(agent.meta.type, agent)
    
    // Set up result listener
    agent.on((taskOrResult: Task | TaskResult) => {
      if (this.isTaskResult(taskOrResult)) {
        console.log(`Router received result: ${taskOrResult.id}`)
        this.taskResults.set(taskOrResult.id, taskOrResult)
        
        // Mark as completed in task queue if it's a dependency queue
        if (this.taskQueue instanceof DependencyTaskQueue) {
          this.taskQueue.markCompleted(taskOrResult.id)
        }
        
        // Emit result to router listeners
        if (this.resultEmitter) {
          this.resultEmitter(taskOrResult)
        }
        
        // Process next task if available
        this.processNextTask()
      }
      // Handle tasks if needed (for plan execution, etc.)
    })
  }

  unregisterAgent(agentType: string): void {
    console.log(`Unregistering agent with type: ${agentType}`)
    this.agents.delete(agentType)
  }

  private isTaskResult(item: Task | TaskResult): item is TaskResult {
    return 'result' in item && 'start' in item && 'end' in item
  }

  onResult(listener: (result: TaskResult) => void): void {
    this.resultEmitter = listener
  }

  enqueueTask(task: Task): void {
    console.log(`Enqueueing task: ${task.id} for executor: ${task.executor}`)
    this.taskQueue.enqueue(task)
    this.processNextTask()
  }

  private processNextTask(): void {
    const task = this.taskQueue.dequeue()
    if (!task) return

    console.log(`Processing task: ${task.id} for executor: ${task.executor}`)
    const agent = this.agents.get(task.executor)
    if (!agent) {
      console.error(`No agent found for executor: ${task.executor}`)
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

  getRegisteredAgents(): string[] {
    return Array.from(this.agents.keys())
  }
}