import { Task, TaskResult, Plan, SubTask, Stream, Emiter } from './task'
import { TaskQueue, DependencyTaskQueue, MessageQueue, InMemoryMessageQueue } from './queue'

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

export abstract class Agent implements
  Channel<Task, TaskResult>
{
  private taskQueue: TaskQueue
  private resultQueue: MessageQueue<TaskResult>
  private taskResults = new Map<string, TaskResult>()
  private running = false
  public readonly executor: string

  constructor(
    executor: string,
    taskQueue?: TaskQueue,
    resultQueue?: MessageQueue<TaskResult>
  ) {
    this.executor = executor
    this.taskQueue = taskQueue || new DependencyTaskQueue()
    this.resultQueue = resultQueue || new InMemoryMessageQueue<TaskResult>()
  }

  async processTask(task: Task): Promise<TaskResult> {
    const start = new Date()
    
    try {
      const response = await this.executeTask(task.params)
      
      // Check if response is a Plan
      if (this.isPlan(response)) {
        await this.executePlan(response)
        return {
          result: { data: 'Plan executed' },
          start,
          end: new Date(),
          id: task.id
        }
      }
      
      return {
        result: { data: response },
        start,
        end: new Date(),
        id: task.id
      }
    } catch (error) {
      return {
        result: { error },
        start,
        end: new Date(),
        id: task.id
      }
    }
  }

  protected abstract executeTask(params: any): Promise<any>

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
          this.flushQueueToTaskQueue(planQueue)
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

  private flushQueueToTaskQueue(planQueue: DependencyTaskQueue): void {
    while (!planQueue.isEmpty()) {
      const task = planQueue.dequeue()
      if (task) {
        this.taskQueue.enqueue(task)
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

  enqueueTask(task: Task): void {
    this.taskQueue.enqueue(task)
  }

  dequeueTask(): Task | undefined {
    return this.taskQueue.dequeue()
  }

  peekNextTask(): Task | undefined {
    return this.taskQueue.peek()
  }

  recordTaskResult(result: TaskResult): void {
    this.taskResults.set(result.id, result)
    this.resultQueue.enqueue(result)
    
    // Mark as completed in task queue if it's a dependency queue
    if (this.taskQueue instanceof DependencyTaskQueue) {
      this.taskQueue.markCompleted(result.id)
    }
  }

  getTaskResult(taskId: string): TaskResult | undefined {
    return this.taskResults.get(taskId)
  }

  getNextResult(): TaskResult | undefined {
    return this.resultQueue.dequeue()
  }

  peekNextResult(): TaskResult | undefined {
    return this.resultQueue.peek()
  }

  getResultQueueSize(): number {
    return this.resultQueue.size()
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