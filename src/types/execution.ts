import { ExecutionPlan, Resource } from './planning';
import { WorkflowResult } from './workflow';

export interface ExecutionResult {
  executionId: string;
  planId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: ExecutionError;
  metrics: ExecutionMetrics;
  resourceUsage: ResourceUsage[];
  timeline: ExecutionEvent[];
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ExecutionError {
  code: string;
  message: string;
  taskId?: string;
  timestamp: Date;
  recoverable: boolean;
  context?: Record<string, any>;
}

export interface ExecutionMetrics {
  totalDuration: number;
  effectiveDuration: number;
  totalCost: number;
  resourceEfficiency: number;
  qualityScore: number;
  successRate: number;
  throughput: number;
  errorRate: number;
}

export interface ResourceUsage {
  resourceId: string;
  resourceType: string;
  amountUsed: number;
  cost: number;
  startTime: Date;
  endTime?: Date;
  efficiency: number;
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
  EXECUTION_PAUSED = 'execution_paused',
  EXECUTION_RESUMED = 'execution_resumed',
  EXECUTION_CANCELLED = 'execution_cancelled',
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  RESOURCE_ALLOCATED = 'resource_allocated',
  RESOURCE_RELEASED = 'resource_released',
  CHECKPOINT_CREATED = 'checkpoint_created',
  RECOVERY_INITIATED = 'recovery_initiated'
}

export interface ExecutionUpdate {
  executionId: string;
  timestamp: Date;
  status: ExecutionStatus;
  progress: ExecutionProgress;
  currentTask?: string;
  metrics: Partial<ExecutionMetrics>;
  events: ExecutionEvent[];
  messages: ExecutionMessage[];
}

export interface ExecutionProgress {
  percentage: number;
  completedTasks: number;
  totalTasks: number;
  estimatedTimeRemaining?: number;
  currentPhase: string;
}

export interface ExecutionMessage {
  level: MessageLevel;
  message: string;
  timestamp: Date;
  taskId?: string;
  context?: Record<string, any>;
}

export enum MessageLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface ExecutionCheckpoint {
  id: string;
  executionId: string;
  timestamp: Date;
  state: ExecutionState;
  metadata: Record<string, any>;
}

export interface ExecutionState {
  currentTaskId?: string;
  completedTasks: string[];
  taskStates: Map<string, any>;
  resourceAllocations: Map<string, Resource>;
  variables: Map<string, any>;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  applicableErrors: string[];
  execute(context: RecoveryContext): Promise<RecoveryResult>;
}

export interface RecoveryContext {
  executionId: string;
  error: ExecutionError;
  state: ExecutionState;
  plan: ExecutionPlan;
  resources: Resource[];
}

export interface RecoveryResult {
  success: boolean;
  action: RecoveryAction;
  newState?: ExecutionState;
  message: string;
}

export enum RecoveryAction {
  RETRY = 'retry',
  SKIP = 'skip',
  FALLBACK = 'fallback',
  ABORT = 'abort',
  CHECKPOINT_RESTORE = 'checkpoint_restore'
}

export interface ExecutionEngine {
  execute(plan: ExecutionPlan): Promise<ExecutionResult>;
  pause(executionId: string): Promise<void>;
  resume(executionId: string): Promise<void>;
  cancel(executionId: string): Promise<void>;
  
  getStatus(executionId: string): ExecutionStatus;
  getResult(executionId: string): ExecutionResult | undefined;
  
  monitor(executionId: string): AsyncIterable<ExecutionUpdate>;
  
  createCheckpoint(executionId: string): Promise<ExecutionCheckpoint>;
  restoreFromCheckpoint(checkpointId: string): Promise<void>;
  
  addRecoveryStrategy(strategy: RecoveryStrategy): void;
  removeRecoveryStrategy(strategyId: string): void;
  
  allocateResources(requirements: ResourceRequirement[]): Promise<Resource[]>;
  releaseResources(resourceIds: string[]): Promise<void>;
  
  subscribe(executionId: string, callback: ExecutionEventCallback): void;
  unsubscribe(executionId: string, callback: ExecutionEventCallback): void;
}

export interface ResourceRequirement {
  type: string;
  amount: number;
  duration?: number;
  priority: number;
  constraints?: Record<string, any>;
}

export type ExecutionEventCallback = (update: ExecutionUpdate) => void;

export interface MonitoringSystem {
  startMonitoring(executionId: string): void;
  stopMonitoring(executionId: string): void;
  
  getMetrics(executionId: string): ExecutionMetrics;
  getResourceUsage(executionId: string): ResourceUsage[];
  getTimeline(executionId: string): ExecutionEvent[];
  
  setAlert(condition: AlertCondition, callback: AlertCallback): string;
  removeAlert(alertId: string): void;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration?: number;
}

export type AlertCallback = (alert: Alert) => void;

export interface Alert {
  id: string;
  executionId: string;
  condition: AlertCondition;
  triggered: Date;
  value: number;
  message: string;
}