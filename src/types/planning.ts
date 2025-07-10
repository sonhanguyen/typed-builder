import { Task, Workflow } from './workflow';
import { AgentCapability } from './agent';

export interface PlanningConstraints {
  maxDuration?: number;           // Maximum allowed execution time (ms)
  requiredCapabilities?: string[]; // Capabilities that must be used
  excludedCapabilities?: string[]; // Capabilities to avoid
}

export interface ExecutionPlan {
  id: string;                    // Unique plan identifier
  goal: string;                  // Target goal description
  workflow: Workflow;           // Generated workflow with tasks
  estimatedDuration?: number;   // Estimated completion time
  createdAt: Date;
}

export interface Planner {
  createPlan(
    goal: string, 
    capabilities: AgentCapability[], 
    constraints?: PlanningConstraints
  ): Promise<ExecutionPlan>;
}