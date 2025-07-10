# Planning System Documentation

## Overview

The planning system provides dynamic planning capabilities for LLM agents. It analyzes user goals and available capabilities to generate executable workflows that can be executed using LangGraph. The focus is on simplicity and flexibility rather than complex optimization.

## Core Concepts

### Planning Constraints

Simple limitations and requirements that guide the planning process.

```typescript
interface PlanningConstraints {
  maxDuration?: number;           // Maximum allowed execution time (ms)
  requiredCapabilities?: string[]; // Capabilities that must be used
  excludedCapabilities?: string[]; // Capabilities to avoid
}
```

### Execution Plan

A plan containing the goal and dynamically generated workflow.

```typescript
interface ExecutionPlan {
  id: string;                    // Unique plan identifier
  goal: string;                  // Target goal description
  workflow: Workflow;           // Generated workflow with tasks
  estimatedDuration?: number;   // Estimated completion time
  createdAt: Date;
}
```

## Dynamic Planning

### The Planning Process

1. **Goal Analysis**: Break down the user goal into actionable components
2. **Capability Mapping**: Match available capabilities to required actions
3. **Task Generation**: Create specific tasks with dependencies
4. **Workflow Assembly**: Organize tasks into executable workflow

```typescript
// Planning flow
const plan = await planner.createPlan(goal, capabilities, constraints);
const graph = buildGraphFromPlan(plan);
const result = await graph.invoke({ goal });
```

### Task Types

Tasks can have different execution patterns:

- **ATOMIC**: Single, indivisible action
- **SEQUENTIAL**: Tasks that must run in order
- **PARALLEL**: Tasks that can run concurrently
- **CONDITIONAL**: Tasks with branching logic

```typescript
interface Task {
  id: string;
  name: string;
  type: 'atomic' | 'sequential' | 'parallel' | 'conditional';
  dependencies: string[];       // IDs of prerequisite tasks
  parameters: Record<string, any>;
}
```

## Workflow Structure

### Workflow

Container for organized tasks with dependency relationships.

```typescript
interface Workflow {
  id: string;
  tasks: Task[];               // All tasks in execution order
  
  // Helper methods
  addTask(task: Task): void;
  removeTask(taskId: string): void;
  getExecutableNodes(): Task[]; // Tasks ready to run
  isComplete(): boolean;
}
```

### Dynamic Workflow Generation

The planner dynamically creates workflows based on:

- **Goal complexity**: Simple goals → fewer tasks, complex goals → more tasks
- **Available capabilities**: Only uses capabilities the agent has
- **Task dependencies**: Ensures proper execution order

```typescript
// Example: Research goal generates multi-step workflow
const goal = "Research market trends in renewable energy";

// Planner generates:
const workflow = {
  tasks: [
    {
      id: "search_trends",
      type: "atomic",
      dependencies: [],
      // ... search for trend data
    },
    {
      id: "analyze_data", 
      type: "parallel",
      dependencies: ["search_trends"],
      // ... analyze collected data
    },
    {
      id: "generate_report",
      type: "atomic", 
      dependencies: ["analyze_data"],
      // ... create final report
    }
  ]
};
```

## Planner Interface

### Planner

Main interface for the planning system.

```typescript
interface Planner {
  createPlan(
    goal: string, 
    capabilities: AgentCapability[], 
    constraints?: PlanningConstraints
  ): Promise<ExecutionPlan>;
}
```

### LangGraph Integration

Convert plans to executable LangGraph structures:

```typescript
function buildGraphFromPlan(plan: ExecutionPlan): StateGraph {
  const graph = new StateGraph();
  
  // Add nodes for each task
  for (const task of plan.workflow.tasks) {
    graph.add_node(task.id, createTaskFunction(task));
  }
  
  // Add edges based on dependencies
  for (const task of plan.workflow.tasks) {
    if (task.dependencies.length === 0) {
      graph.add_edge(START, task.id);
    }
    for (const dep of task.dependencies) {
      graph.add_edge(dep, task.id);
    }
  }
  
  return graph.compile();
}
```

## Usage Examples

### Basic Plan Creation

```typescript
const planner: Planner = new DefaultPlanner();

const goal = "Create a market analysis report";

const capabilities: AgentCapability[] = [
  { id: "web_search", name: "Web Search", description: "Search for information" },
  { id: "data_analysis", name: "Data Analysis", description: "Analyze datasets" },
  { id: "report_generation", name: "Report Generation", description: "Generate reports" }
];

const constraints: PlanningConstraints = {
  maxDuration: 7200000, // 2 hours
  requiredCapabilities: ["web_search", "data_analysis"]
};

const plan = await planner.createPlan(goal, capabilities, constraints);
```

### Plan to Graph Execution

```typescript
// Create plan
const plan = await planner.createPlan(goal, capabilities);

// Convert to LangGraph
const graph = buildGraphFromPlan(plan);

// Execute with streaming
for await (const chunk of graph.stream({ goal }, { 
  configurable: { thread_id: "session-123" }
})) {
  console.log("Step completed:", chunk);
}

// Or execute synchronously
const result = await graph.invoke({ goal }, {
  configurable: { thread_id: "session-123" }
});
```

### Capability-Driven Planning

```typescript
// Planning adapts to available capabilities
const basicCapabilities = [
  { id: "web_search", name: "Web Search", description: "Search the web" }
];

const advancedCapabilities = [
  { id: "web_search", name: "Web Search", description: "Search the web" },
  { id: "data_analysis", name: "Data Analysis", description: "Analyze data" },
  { id: "visualization", name: "Data Visualization", description: "Create charts" },
  { id: "report_generation", name: "Report Generation", description: "Generate reports" }
];

// Same goal, different plans based on capabilities
const basicPlan = await planner.createPlan(goal, basicCapabilities);
const advancedPlan = await planner.createPlan(goal, advancedCapabilities);

console.log(`Basic plan: ${basicPlan.workflow.tasks.length} tasks`);
console.log(`Advanced plan: ${advancedPlan.workflow.tasks.length} tasks`);
```

### Constraint Handling

```typescript
// Time-constrained planning
const timeConstraints: PlanningConstraints = {
  maxDuration: 1800000, // 30 minutes
  requiredCapabilities: ["web_search"]
};

const quickPlan = await planner.createPlan(goal, capabilities, timeConstraints);

// Capability-constrained planning
const limitedConstraints: PlanningConstraints = {
  excludedCapabilities: ["external_api"], // Avoid external dependencies
  requiredCapabilities: ["local_analysis"]
};

const offlinePlan = await planner.createPlan(goal, capabilities, limitedConstraints);
```

## Task Function Creation

### Converting Tasks to Functions

Each task in the workflow becomes a function in the LangGraph:

```typescript
function createTaskFunction(task: Task) {
  return async (state: any) => {
    switch (task.type) {
      case 'atomic':
        return await executeAtomicTask(task, state);
      case 'parallel':
        return await executeParallelTask(task, state);
      case 'conditional':
        return await executeConditionalTask(task, state);
      default:
        return await executeSequentialTask(task, state);
    }
  };
}

async function executeAtomicTask(task: Task, state: any) {
  // Execute single action based on task parameters
  const capability = getCapabilityById(task.parameters.capabilityId);
  return await capability.execute(task.parameters);
}
```

## Best Practices

### Planning Strategy

1. **Goal Decomposition**: Break complex goals into manageable tasks
2. **Capability Utilization**: Use available capabilities effectively
3. **Dependency Management**: Ensure proper task ordering
4. **Constraint Respect**: Stay within specified limits

### Task Design

1. **Atomic Tasks**: Keep individual tasks focused and specific
2. **Clear Dependencies**: Make task relationships explicit
3. **Parameter Passing**: Use task parameters for configuration
4. **Error Handling**: Plan for task failure scenarios

### Workflow Optimization

1. **Parallel Execution**: Identify tasks that can run concurrently
2. **Resource Efficiency**: Avoid unnecessary task duplication
3. **Early Termination**: Allow workflows to stop early when goals are met
4. **Incremental Progress**: Design tasks to build on each other

### LangGraph Integration

1. **State Management**: Use graph state to pass data between tasks
2. **Checkpointing**: Leverage LangGraph's built-in checkpointing
3. **Streaming**: Use streaming for real-time progress updates
4. **Error Recovery**: Handle task failures gracefully within the graph