import { Task, Workflow } from './workflow';

export interface PlanningConstraints {
  maxDuration?: number;
  maxCost?: number;
  availableResources?: Resource[];
  deadline?: Date;
  priorityThreshold?: Priority;
  excludedCapabilities?: string[];
  requiredCapabilities?: string[];
}

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  capacity: number;
  available: number;
  cost?: number;
  metadata?: Record<string, any>;
}

export enum ResourceType {
  COMPUTATIONAL = 'computational',
  MEMORY = 'memory',
  STORAGE = 'storage',
  NETWORK = 'network',
  API_QUOTA = 'api_quota',
  HUMAN = 'human',
  EXTERNAL_SERVICE = 'external_service'
}

export interface ExecutionPlan {
  id: string;
  goal: string;
  strategy: PlanningStrategy;
  workflow: Workflow;
  constraints: PlanningConstraints;
  estimatedDuration: number;
  estimatedCost: number;
  riskAssessment: RiskAssessment;
  alternatives: AlternativePlan[];
  createdAt: Date;
  
  validate(): PlanValidationResult;
  optimize(criteria: OptimizationCriteria): ExecutionPlan;
  getResourceRequirements(): ResourceRequirement[];
}

export enum PlanningStrategy {
  GREEDY = 'greedy',
  OPTIMAL = 'optimal',
  HEURISTIC = 'heuristic',
  ADAPTIVE = 'adaptive',
  MONTE_CARLO = 'monte_carlo'
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  risks: Risk[];
  mitigations: Mitigation[];
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Risk {
  id: string;
  type: RiskType;
  description: string;
  probability: number;
  impact: RiskLevel;
  taskIds?: string[];
}

export enum RiskType {
  RESOURCE_SHORTAGE = 'resource_shortage',
  DEPENDENCY_FAILURE = 'dependency_failure',
  TIMEOUT = 'timeout',
  API_LIMIT = 'api_limit',
  EXTERNAL_SERVICE = 'external_service',
  DATA_QUALITY = 'data_quality',
  SECURITY = 'security'
}

export interface Mitigation {
  riskId: string;
  strategy: MitigationStrategy;
  description: string;
  cost: number;
  effectiveness: number;
}

export enum MitigationStrategy {
  AVOIDANCE = 'avoidance',
  MITIGATION = 'mitigation',
  TRANSFER = 'transfer',
  ACCEPTANCE = 'acceptance',
  CONTINGENCY = 'contingency'
}

export interface AlternativePlan {
  id: string;
  description: string;
  workflow: Workflow;
  estimatedDuration: number;
  estimatedCost: number;
  tradeoffs: string[];
}

export interface PlanValidationResult {
  isValid: boolean;
  errors: PlanValidationError[];
  warnings: PlanValidationWarning[];
  suggestions: PlanSuggestion[];
}

export interface PlanValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  taskId?: string;
}

export interface PlanValidationWarning {
  code: string;
  message: string;
  taskId?: string;
}

export interface PlanSuggestion {
  type: 'optimization' | 'alternative' | 'improvement';
  description: string;
  expectedBenefit: string;
}

export interface OptimizationCriteria {
  optimizeFor: OptimizationTarget;
  weights?: OptimizationWeights;
  constraints?: OptimizationConstraints;
}

export enum OptimizationTarget {
  DURATION = 'duration',
  COST = 'cost',
  QUALITY = 'quality',
  RELIABILITY = 'reliability',
  RESOURCE_EFFICIENCY = 'resource_efficiency'
}

export interface OptimizationWeights {
  duration: number;
  cost: number;
  quality: number;
  reliability: number;
}

export interface OptimizationConstraints {
  maxDuration?: number;
  maxCost?: number;
  minQuality?: number;
  minReliability?: number;
}

export interface ResourceRequirement {
  resourceType: ResourceType;
  amount: number;
  duration: number;
  critical: boolean;
  alternatives?: string[];
}

export interface Planner {
  createPlan(
    goal: string, 
    capabilities: AgentCapability[], 
    constraints?: PlanningConstraints
  ): Promise<ExecutionPlan>;
  
  optimizePlan(
    plan: ExecutionPlan, 
    criteria: OptimizationCriteria
  ): Promise<ExecutionPlan>;
  
  validatePlan(plan: ExecutionPlan): PlanValidationResult;
  
  generateAlternatives(
    goal: string, 
    constraints: PlanningConstraints
  ): Promise<AlternativePlan[]>;
  
  assessRisk(plan: ExecutionPlan): RiskAssessment;
  
  estimateResources(plan: ExecutionPlan): ResourceRequirement[];
}