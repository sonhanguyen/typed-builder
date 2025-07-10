import { ExecutionPlan } from './planning';
import { Task } from './workflow';

// Basic execution result for LangGraph integration
export interface ExecutionResult {
  executionId: string;
  planId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: ExecutionError;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ExecutionError {
  code: string;
  message: string;
  taskId?: string;
  timestamp: Date;
}

// Progress tracking for streaming
export interface ExecutionUpdate {
  executionId: string;
  timestamp: Date;
  status: ExecutionStatus;
  progress: ExecutionProgress;
  currentTask?: string;
  events: ExecutionEvent[];
}

export interface ExecutionProgress {
  percentage: number;
  completedTasks: number;
  totalTasks: number;
  currentPhase: string;
}

export interface ExecutionEvent {
  id: string;
  type: ExecutionEventType;
  timestamp: Date;
  taskId?: string;
  description: string;
  data?: any;
}

export enum ExecutionEventType {
  EXECUTION_STARTED = 'execution_started',
  EXECUTION_COMPLETED = 'execution_completed',
  EXECUTION_FAILED = 'execution_failed',
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed'
}

// LangGraph integration utilities
export interface BuildGraphFromPlan {
  (plan: ExecutionPlan): any; // Returns LangGraph StateGraph
}

export interface CreateTaskFunction {
  (task: Task): (state: any) => Promise<any>;
}