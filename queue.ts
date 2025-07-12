import { Task, TaskResult, SubTask } from './task'

export interface MessageQueue<T> {
  enqueue(item: T): void
  dequeue(): T | undefined
  peek(): T | undefined
  size(): number
  isEmpty(): boolean
  clear(): void
}

export class InMemoryMessageQueue<T> implements MessageQueue<T> {
  private items: T[] = []

  enqueue(item: T): void {
    this.items.push(item)
  }

  dequeue(): T | undefined {
    return this.items.shift()
  }

  peek(): T | undefined {
    return this.items[0]
  }

  size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  clear(): void {
    this.items = []
  }
}

export interface TaskQueue {
  enqueue(task: Task): void
  dequeue(): Task | undefined
  peek(): Task | undefined
  size(): number
  isEmpty(): boolean
  clear(): void
}

export class DependencyTaskQueue implements TaskQueue {
  private tasks: SubTask[] = []
  private completed = new Set<string>()
  private processing = new Set<string>()

  enqueue(task: Task): void {
    this.tasks.push(task as SubTask)
  }

  dequeue(): Task | undefined {
    // Find a task with all dependencies completed
    const availableIndex = this.tasks.findIndex(task => 
      !task.dependencies || 
      task.dependencies.every(dep => this.completed.has(dep))
    )
    
    if (availableIndex === -1) return undefined
    
    const task = this.tasks.splice(availableIndex, 1)[0]
    this.processing.add(task.id)
    return task
  }

  peek(): Task | undefined {
    return this.tasks.find(task => 
      !task.dependencies || 
      task.dependencies.every(dep => this.completed.has(dep))
    )
  }

  size(): number {
    return this.tasks.length
  }

  isEmpty(): boolean {
    return this.tasks.length === 0
  }

  clear(): void {
    this.tasks = []
    this.completed.clear()
    this.processing.clear()
  }

  markCompleted(taskId: string): void {
    this.completed.add(taskId)
    this.processing.delete(taskId)
  }

  isProcessing(taskId: string): boolean {
    return this.processing.has(taskId)
  }
}