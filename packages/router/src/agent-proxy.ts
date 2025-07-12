import { Socket } from 'socket.io'
import { Task, TaskResult, Agent } from '../../types'

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
      console.log(`Received result from worker ${this.id}:`, result)
      if (this.resultEmitter) {
        this.resultEmitter(result)
      }
    })
    
    // Listen for tasks from the worker (if worker needs to emit tasks)
    this.socket.on('task', (task: Task) => {
      console.log(`Received task from worker ${this.id}:`, task)
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
      console.log(`Sending task to worker ${this.id}:`, taskOrResult)
      // Send task to worker
      this.socket.emit('task', taskOrResult)
    } else {
      console.log(`Sending result to worker ${this.id}:`, taskOrResult)
      // Send result to worker (if needed)
      this.socket.emit('task-result', taskOrResult)
    }
  }

  private isTask(item: Task | TaskResult): item is Task {
    return 'executor' in item && 'params' in item
  }
}