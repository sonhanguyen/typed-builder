import { Task } from './workflow'

export interface Resource {
  id: string
  type: string
  status: ResourceStatus
  metadata?: Record<string, any>
}

export enum ResourceStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ERROR = 'error'
}

export interface Worker {
  id: string
  name: string
  resources: Resource[]
  
  canExecute(task: Task): boolean
  execute(task: Task): Promise<void>
  
  addResource(resource: Resource): void
  removeResource(resourceId: string): void
  getAvailableResources(): Resource[]
}

export interface BrowserResource extends Resource {
  type: 'browser'
  metadata: {
    browserType: 'chrome' | 'firefox' | 'safari'
    version: string
    url?: string
  }
}

export interface SandboxResource extends Resource {
  type: 'sandbox'
  metadata: {
    language: string
    timeout: number
    workingDirectory?: string
  }
}

export interface WorkerPool {
  workers: Worker[]
  
  findWorker(task: Task): Worker | null
  addWorker(worker: Worker): void
  removeWorker(workerId: string): void
  getAvailableWorkers(): Worker[]
}