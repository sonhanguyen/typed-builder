# LLM Agent Framework

A comprehensive TypeScript framework for building LLM agents with complex planning and workflow capabilities. This framework provides a modular, type-safe foundation for creating sophisticated AI agents that can plan, execute, and monitor complex multi-step tasks.

## Features

- 🤖 **Modular Agent Architecture** - Capability-based agent design with pluggable skills
- 📋 **Advanced Planning System** - Multi-strategy planning with optimization and risk assessment
- 🔄 **Robust Workflow Engine** - Support for sequential, parallel, conditional, and iterative workflows
- ⚡ **Real-time Execution** - Live monitoring, checkpointing, and recovery mechanisms
- 🎯 **Resource Management** - Intelligent resource allocation and optimization
- 📊 **Comprehensive Monitoring** - Real-time metrics, alerting, and performance tracking
- 🛡️ **Fault Tolerance** - Automatic recovery strategies and graceful degradation
- 🔧 **Type Safety** - Full TypeScript support with comprehensive type definitions

## Architecture Overview

The framework consists of four main subsystems:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Agent     │────│  Planning   │────│  Workflow   │────│ Execution   │
│   System    │    │   System    │    │   Engine    │    │   Engine    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                     │                 │                 │
      │                     │                 │                 │
   Capabilities        Risk Assessment    Task Management   Monitoring
   Memory System       Resource Planning  Event System     Recovery
   Context Management  Optimization       Validation       Checkpointing
```

### Core Components

1. **[Agent System](./docs/agent.md)** - Core agent interfaces with capability management
2. **[Planning System](./docs/planning.md)** - Strategic planning with optimization and risk assessment
3. **[Workflow Engine](./docs/workflow.md)** - Task orchestration and execution management
4. **[Execution System](./docs/execution.md)** - Real-time execution with monitoring and recovery

## Quick Start

### Installation

```bash
npm install llm-agent-framework
```

### Basic Usage

```typescript
import { LLMAgent, AgentCapability, PlanningConstraints } from 'llm-agent-framework';

// Define agent capabilities
const capabilities: AgentCapability[] = [
  {
    id: "web_search",
    name: "Web Search",
    description: "Search the web for information",
    parameters: { maxResults: 10 }
  },
  {
    id: "data_analysis",
    name: "Data Analysis", 
    description: "Analyze and process data",
    parameters: { maxDataSize: 1000000 }
  }
];

// Create agent
const agent: LLMAgent = new DefaultLLMAgent({
  id: "research-agent",
  name: "Research Assistant",
  capabilities,
  context: {
    sessionId: "session-123",
    environment: { locale: "en-US" },
    memory: {
      shortTerm: new Map(),
      longTerm: new Map(),
      episodic: []
    }
  }
});

// Define goal and constraints
const goal = "Research the latest developments in quantum computing";
const constraints: PlanningConstraints = {
  maxDuration: 3600000, // 1 hour
  maxCost: 50,
  requiredCapabilities: ["web_search", "data_analysis"]
};

// Plan and execute
async function executeTask() {
  // Create execution plan
  const plan = await agent.plan(goal, constraints);
  console.log(`Created plan with ${plan.workflow.tasks.length} tasks`);
  
  // Execute the plan
  const result = await agent.execute(plan);
  
  // Monitor execution
  for await (const update of agent.monitor(result.executionId)) {
    console.log(`Progress: ${update.progress.percentage}%`);
    console.log(`Current task: ${update.currentTask}`);
    
    if (update.status === 'completed' || update.status === 'failed') {
      break;
    }
  }
  
  console.log('Execution completed:', result);
}

executeTask().catch(console.error);
```

## Key Concepts

### Agent Capabilities

Agents are composed of modular capabilities that define what they can do:

```typescript
const webSearchCapability: AgentCapability = {
  id: "web_search",
  name: "Web Search",
  description: "Search the web using various search engines",
  parameters: {
    maxResults: 10,
    timeout: 30000,
    allowedDomains: ["*.edu", "*.org"]
  }
};
```

### Planning and Optimization

The planning system creates optimized execution plans with risk assessment:

```typescript
const plan = await planner.createPlan(goal, capabilities, {
  maxDuration: 7200000,
  maxCost: 100,
  optimizeFor: OptimizationTarget.QUALITY
});

// Assess risks
const riskAssessment = planner.assessRisk(plan);
console.log(`Overall risk: ${riskAssessment.overallRisk}`);
```

### Workflow Execution

Workflows support various execution patterns:

```typescript
const workflow: WorkflowDefinition = {
  name: "Data Processing Pipeline",
  tasks: [
    {
      id: "extract",
      type: TaskType.ATOMIC,
      dependencies: []
    },
    {
      id: "transform", 
      type: TaskType.PARALLEL,
      dependencies: ["extract"]
    },
    {
      id: "load",
      type: TaskType.ATOMIC,
      dependencies: ["transform"]
    }
  ]
};
```

### Real-time Monitoring

Monitor execution with comprehensive observability:

```typescript
// Subscribe to execution events
engine.subscribe(executionId, (update) => {
  console.log(`Status: ${update.status}`);
  console.log(`Progress: ${update.progress.percentage}%`);
  console.log(`Metrics:`, update.metrics);
});

// Set up alerts
monitoring.setAlert(
  { metric: "cpu_usage", operator: "gt", threshold: 90 },
  (alert) => console.log("High CPU usage detected!")
);
```

## Advanced Features

### Memory Management

Agents maintain multi-layered memory systems:

- **Short-term**: Session variables and temporary data
- **Long-term**: Learned patterns and persistent knowledge  
- **Episodic**: Complete interaction histories

### Recovery and Fault Tolerance

Automatic recovery from common failure modes:

```typescript
const recoveryStrategy: RecoveryStrategy = {
  id: "retry_with_backoff",
  applicableErrors: ["NETWORK_TIMEOUT", "RATE_LIMIT"],
  async execute(context) {
    // Implement exponential backoff retry logic
    return { success: true, action: RecoveryAction.RETRY };
  }
};

engine.addRecoveryStrategy(recoveryStrategy);
```

### Resource Optimization

Intelligent resource allocation and management:

```typescript
const resources = await engine.allocateResources([
  { type: "computational", amount: 4, priority: 8 },
  { type: "memory", amount: 8192, priority: 7 }
]);
```

### Checkpointing

Save and restore execution state:

```typescript
// Create checkpoint
const checkpoint = await engine.createCheckpoint(executionId);

// Restore from checkpoint
await engine.restoreFromCheckpoint(checkpoint.id);
```

## Documentation

- **[Agent System](./docs/agent.md)** - Core agent interfaces and capabilities
- **[Planning System](./docs/planning.md)** - Strategic planning and optimization
- **[Workflow Engine](./docs/workflow.md)** - Task orchestration and management
- **[Execution System](./docs/execution.md)** - Real-time execution and monitoring

## Examples

### Research Agent

```typescript
// Create a research agent with web search and analysis capabilities
const researchAgent = createAgent({
  capabilities: ["web_search", "document_analysis", "report_generation"],
  goal: "Analyze market trends in renewable energy"
});
```

### Code Review Agent  

```typescript
// Create a code review agent with development capabilities
const codeReviewAgent = createAgent({
  capabilities: ["code_analysis", "git_operations", "issue_tracking"],
  goal: "Review pull request and provide feedback"
});
```

### Data Processing Agent

```typescript
// Create a data processing agent with ETL capabilities
const dataAgent = createAgent({
  capabilities: ["data_extraction", "data_transformation", "data_loading"],
  goal: "Process customer data pipeline"
});
```

## Development

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

### Development Mode

```bash
npm run dev
```

## TypeScript Support

This framework is built with TypeScript first and provides comprehensive type definitions for all interfaces and components. All types are exported from the main module:

```typescript
import {
  LLMAgent,
  AgentCapability,
  ExecutionPlan,
  Workflow,
  Task,
  ExecutionResult,
  // ... all other types
} from 'llm-agent-framework';
```

## Design Philosophy

### Modularity

The framework is designed with modularity at its core. Agents are composed of discrete capabilities, workflows are built from reusable tasks, and the entire system can be extended with custom implementations.

### Type Safety

Full TypeScript support ensures type safety throughout the system, catching errors at compile time and providing excellent developer experience with IDE support.

### Observability

Comprehensive monitoring, logging, and metrics collection provide full visibility into agent behavior and performance.

### Reliability

Built-in fault tolerance, recovery mechanisms, and checkpointing ensure reliable execution even in adverse conditions.

### Performance

Resource management, optimization algorithms, and parallel execution capabilities ensure efficient use of computational resources.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any improvements.

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] **WebSocket Support** - Real-time bidirectional communication
- [ ] **Distributed Execution** - Multi-node execution capabilities
- [ ] **ML Model Integration** - Native support for ML model capabilities
- [ ] **Visual Workflow Editor** - Browser-based workflow design tools
- [ ] **Performance Analytics** - Advanced performance analysis and optimization
- [ ] **Plugin Ecosystem** - Standardized plugin architecture for capabilities

## Architecture Decisions

### Why TypeScript?

TypeScript provides compile-time type safety, excellent IDE support, and helps prevent runtime errors in complex agent systems.

### Why Capability-Based Design?

Capability-based design allows for:
- Modular agent composition
- Clear separation of concerns
- Easy testing and mocking
- Runtime capability introspection

### Why Event-Driven Architecture?

Event-driven architecture enables:
- Real-time monitoring and updates
- Loose coupling between components
- Easy integration with external systems
- Comprehensive audit trails

### Why Multi-Strategy Planning?

Different planning strategies are optimal for different scenarios:
- **Greedy**: Fast decisions for time-critical tasks
- **Optimal**: Best solutions for critical operations
- **Adaptive**: Learning-based approaches for dynamic environments
- **Heuristic**: Domain-specific optimizations