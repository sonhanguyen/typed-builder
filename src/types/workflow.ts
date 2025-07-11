import { Agent } from './agent'

export interface TaskInput {
  [key: string]: any
}

export interface TaskOutput {
  [key: string]: any
}

export interface Task {
  id: string
  name: string
  type: 'tool_call' | 'agent_call'
  dependencies: string[]
  input: TaskInput
  output?: TaskOutput
  status: TaskStatus
  
  // For tool calls
  toolName?: string
  toolParameters?: Record<string, any>
  
  // For agent calls
  agent?: Agent
  agentInput?: Record<string, any>
}

export enum TaskStatus {
  PENDING = 'pending',
  READY = 'ready',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface Workflow {
  id: string
  name: string
  tasks: Map<string, Task>
  input: Record<string, any>
  output?: Record<string, any>
  
  addTask(task: Task): void
  removeTask(taskId: string): void
  getReadyTasks(): Task[]
  isComplete(): boolean
  canExecute(taskId: string): boolean
}

export interface WorkflowDefinition {
  name: string
  description: string
  tasks: TaskDefinition[]
  metadata?: Record<string, any>
}

export interface TaskDefinition {
  id: string
  name: string
  description: string
  type: 'tool_call' | 'agent_call'
  dependencies: string[]
  input: Record<string, any>
  toolName?: string
  toolParameters?: Record<string, any>
  agentId?: string
  estimatedDuration?: number
}