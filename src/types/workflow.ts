export interface Task {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  dependencies: string[];
  estimatedDuration?: number;
  actualDuration?: number;
  parameters: Record<string, any>;
  result?: any;
  error?: Error;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export enum TaskType {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  CONDITIONAL = 'conditional',
  LOOP = 'loop',
  ATOMIC = 'atomic'
}

export enum TaskStatus {
  PENDING = 'pending',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  status: WorkflowStatus;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  addTask(task: Task): void;
  removeTask(taskId: string): void;
  updateTask(taskId: string, updates: Partial<Task>): void;
  getTask(taskId: string): Task | undefined;
  
  getExecutableNodes(): Task[];
  isComplete(): boolean;
  validate(): ValidationResult;
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  READY = 'ready',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  taskId?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  taskId?: string;
}

export interface WorkflowEngine {
  createWorkflow(definition: WorkflowDefinition): Workflow;
  executeWorkflow(workflow: Workflow): Promise<WorkflowResult>;
  pauseWorkflow(workflowId: string): Promise<void>;
  resumeWorkflow(workflowId: string): Promise<void>;
  cancelWorkflow(workflowId: string): Promise<void>;
  
  getWorkflow(workflowId: string): Workflow | undefined;
  listWorkflows(): Workflow[];
  
  subscribe(workflowId: string, callback: WorkflowEventCallback): void;
  unsubscribe(workflowId: string, callback: WorkflowEventCallback): void;
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  tasks: TaskDefinition[];
  metadata?: Record<string, any>;
}

export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  priority: Priority;
  dependencies: string[];
  parameters: Record<string, any>;
  estimatedDuration?: number;
}

export interface WorkflowResult {
  workflowId: string;
  status: WorkflowStatus;
  startedAt: Date;
  completedAt?: Date;
  results: Map<string, any>;
  errors: Map<string, Error>;
  metrics: WorkflowMetrics;
}

export interface WorkflowMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalDuration: number;
  averageTaskDuration: number;
}

export type WorkflowEventCallback = (event: WorkflowEvent) => void;

export interface WorkflowEvent {
  type: WorkflowEventType;
  workflowId: string;
  taskId?: string;
  timestamp: Date;
  data?: any;
}

export enum WorkflowEventType {
  WORKFLOW_STARTED = 'workflow_started',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_FAILED = 'workflow_failed',
  WORKFLOW_PAUSED = 'workflow_paused',
  WORKFLOW_RESUMED = 'workflow_resumed',
  WORKFLOW_CANCELLED = 'workflow_cancelled',
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  TASK_CANCELLED = 'task_cancelled'
}