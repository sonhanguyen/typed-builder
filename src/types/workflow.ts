export interface Task {
  id: string;
  name: string;
  type: 'atomic' | 'sequential' | 'parallel' | 'conditional';
  dependencies: string[];       // IDs of prerequisite tasks
  parameters: Record<string, any>;
}

export interface Workflow {
  id: string;
  tasks: Task[];               // All tasks in execution order
  
  // Helper methods
  addTask(task: Task): void;
  removeTask(taskId: string): void;
  getExecutableNodes(): Task[]; // Tasks ready to run
  isComplete(): boolean;
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
  type: 'atomic' | 'sequential' | 'parallel' | 'conditional';
  dependencies: string[];
  parameters: Record<string, any>;
  estimatedDuration?: number;
}