import { Workflow, Task } from './workflow'
import { Worker, WorkerPool } from './worker'
import { Agent } from './agent'

export interface ExecutionEngine {
  workerPool: WorkerPool
  agents: Map<string, Agent>
  
  executeWorkflow(workflow: Workflow): AsyncGenerator<ExecutionUpdate, ExecutionResult, unknown>
  executeTask(task: Task, worker: Worker): Promise<TaskResult>
  
  addAgent(agent: Agent): void
  removeAgent(agentId: string): void
}

export interface TaskResult {
  taskId: string
  status: TaskStatus
  output?: any
  error?: Error
  startedAt: Date
  completedAt?: Date
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ExecutionResult {
  workflowId: string
  status: ExecutionStatus
  startedAt: Date
  completedAt?: Date
  result?: any
  error?: ExecutionError
  taskResults: TaskResult[]
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ExecutionError {
  code: string
  message: string
  taskId?: string
  timestamp: Date
}

export interface ExecutionUpdate {
  workflowId: string
  timestamp: Date
  status: ExecutionStatus
  progress: ExecutionProgress
  currentTask?: string
  events: ExecutionEvent[]
}

export interface ExecutionProgress {
  percentage: number
  completedTasks: number
  totalTasks: number
  currentPhase: string
}

export interface ExecutionEvent {
  id: string
  type: ExecutionEventType
  timestamp: Date
  taskId?: string
  description: string
  data?: any
}

export enum ExecutionEventType {
  EXECUTION_STARTED = 'execution_started',
  EXECUTION_COMPLETED = 'execution_completed',
  EXECUTION_FAILED = 'execution_failed',
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed'
}