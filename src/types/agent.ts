import { ExecutionPlan, PlanningConstraints } from './planning';

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface AgentContext {
  sessionId: string;
  userId?: string;
  environment: Record<string, any>;
  memory: AgentMemory;
}

export interface AgentMemory {
  shortTerm: Map<string, any>;
  longTerm: Map<string, any>;
  episodic: AgentEpisode[];
}

export interface AgentEpisode {
  id: string;
  timestamp: Date;
  context: Record<string, any>;
  actions: AgentAction[];
  outcome: AgentOutcome;
}

export interface AgentAction {
  id: string;
  type: string;
  parameters: Record<string, any>;
  timestamp: Date;
  status: ActionStatus;
  result?: any;
  error?: Error;
}

export enum ActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface AgentOutcome {
  success: boolean;
  result?: any;
  error?: Error;
  metrics: Record<string, number>;
}

export interface LLMAgent {
  id: string;
  name: string;
  capabilities: AgentCapability[];
  context: AgentContext;
  
  plan(goal: string, constraints?: PlanningConstraints): Promise<ExecutionPlan>;
  
  addCapability(capability: AgentCapability): void;
  removeCapability(capabilityId: string): void;
  
  updateContext(updates: Partial<AgentContext>): void;
  getMemory(): AgentMemory;
}