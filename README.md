# Dynamic Agent Planning Framework

A TypeScript framework for building LLM agents with dynamic planning capabilities. This framework provides a type-safe foundation for creating AI agents that can dynamically plan and execute complex multi-step tasks using LangGraph for execution.

## Features

- 🤖 **Dynamic Planning** - Generate execution plans from user goals and available capabilities
- 📋 **LangGraph Integration** - Leverage LangGraph's robust execution engine for plan execution
- 🔄 **Flexible Workflows** - Support for sequential, parallel, conditional, and atomic task patterns
- ⚡ **Real-time Execution** - Built-in streaming and checkpointing via LangGraph
- 🎯 **Capability-based Design** - Modular agent composition with pluggable skills
- 🔧 **Type Safety** - Full TypeScript support with comprehensive type definitions

## Architecture Overview

The framework consists of two main components that work together:

```
┌─────────────────┐    ┌─────────────────┐
│   Planning      │ -> │   LangGraph     │
│   System        │    │   Execution     │
└─────────────────┘    └─────────────────┘
        │                       │
   Dynamic Graph           Robust Runtime
   Generation              with Streaming
   Capability Mapping      State Management
   Task Dependencies       Checkpointing
```

### Core Flow

1. **Dynamic Planning** - Analyze user goal and generate execution plan with task dependencies
2. **Graph Generation** - Convert plan into LangGraph StateGraph structure  
3. **Execution** - Run the generated graph with LangGraph's execution engine

### Core Components

1. **[Agent System](./docs/agent.md)** - Core agent interfaces with capability management
2. **[Planning System](./docs/planning.md)** - Dynamic planning with task generation
3. **[Workflow Engine](./docs/workflow.md)** - Task definitions and workflow structures
4. **[Execution System](./docs/execution.md)** - LangGraph integration and execution monitoring

## Quick Start

### Installation

```bash
npm install dynamic-agent-framework
npm install @langchain/langgraph
```

### Basic Usage

```typescript
import { LLMAgent, AgentCapability, buildGraphFromPlan } from 'dynamic-agent-framework';
import { StateGraph } from '@langchain/langgraph';

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

// Create agent with planning capability
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

// Dynamic planning and execution
async function executeTask() {
  const goal = "Research the latest developments in quantum computing";
  
  // 1. Create dynamic execution plan
  const plan = await agent.plan(goal);
  console.log(`Created plan with ${plan.workflow.tasks.length} tasks`);
  
  // 2. Generate LangGraph from plan
  const graph = buildGraphFromPlan(plan);
  
  // 3. Execute with LangGraph
  const result = await graph.invoke({ goal }, { 
    configurable: { thread_id: "research-session" }
  });
  
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

### Dynamic Planning

The planning system analyzes goals and generates executable workflows:

```typescript
const plan = await planner.createPlan(goal, capabilities, {
  maxDuration: 7200000,
  requiredCapabilities: ["web_search", "data_analysis"]
});

// Plan contains dynamically generated task graph
console.log(plan.workflow.tasks); // Array of interconnected tasks
```

### Task Dependencies

Plans automatically handle task dependencies and execution order:

```typescript
const workflow: WorkflowDefinition = {
  name: "Research Pipeline",
  tasks: [
    {
      id: "search",
      type: TaskType.ATOMIC,
      dependencies: [] // Runs first
    },
    {
      id: "analyze", 
      type: TaskType.PARALLEL,
      dependencies: ["search"] // Runs after search
    },
    {
      id: "summarize",
      type: TaskType.ATOMIC,
      dependencies: ["analyze"] // Runs after analyze
    }
  ]
};
```

### LangGraph Integration

Generated plans are converted to LangGraph structures for execution:

```typescript
// Convert plan to executable graph
const graph = buildGraphFromPlan(plan);

// Execute with streaming support
for await (const update of graph.stream({ goal }, config)) {
  console.log(`Current step: ${update}`);
}
```

## Advanced Features

### Memory Management

Agents maintain multi-layered memory systems:

- **Short-term**: Session variables and temporary data
- **Long-term**: Learned patterns and persistent knowledge  
- **Episodic**: Complete interaction histories

### Dynamic Graph Generation

Plans are converted to executable LangGraph structures:

```typescript
function buildGraphFromPlan(plan: ExecutionPlan): StateGraph {
  const graph = new StateGraph();
  
  // Add nodes for each task
  for (const task of plan.workflow.tasks) {
    graph.add_node(task.id, createTaskFunction(task));
  }
  
  // Add edges based on dependencies
  for (const task of plan.workflow.tasks) {
    for (const dep of task.dependencies) {
      graph.add_edge(dep, task.id);
    }
  }
  
  return graph.compile();
}
```

### Checkpointing and Streaming

Built-in support via LangGraph integration:

```typescript
// Checkpointing
const config = { 
  configurable: { thread_id: "session-123" }
};

// Streaming execution
for await (const chunk of graph.stream(inputs, config)) {
  console.log("Step completed:", chunk);
}

// Resume from checkpoint
const result = await graph.invoke(inputs, config); // Automatically resumes
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

const plan = await researchAgent.plan("Find and analyze recent renewable energy market data");
const graph = buildGraphFromPlan(plan);
const result = await graph.invoke({ goal: plan.goal });
```

### Code Review Agent  

```typescript
// Create a code review agent with development capabilities
const codeReviewAgent = createAgent({
  capabilities: ["code_analysis", "git_operations", "issue_tracking"],
  goal: "Review pull request and provide feedback"
});

const plan = await codeReviewAgent.plan("Review PR #123 for security and performance issues");
const graph = buildGraphFromPlan(plan);
const result = await graph.invoke({ prNumber: 123 });
```

### Data Processing Agent

```typescript
// Create a data processing agent with ETL capabilities
const dataAgent = createAgent({
  capabilities: ["data_extraction", "data_transformation", "data_loading"],
  goal: "Process customer data pipeline"
});

const plan = await dataAgent.plan("Extract customer data, clean it, and load to warehouse");
const graph = buildGraphFromPlan(plan);
const result = await graph.invoke({ dataSource: "customers.csv" });
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
  Planner,
  buildGraphFromPlan,
  // ... all other types
} from 'dynamic-agent-framework';
```

## Design Philosophy

### Modularity

The framework is designed with modularity at its core. Agents are composed of discrete capabilities, and workflows are dynamically generated from reusable task patterns.

### Type Safety

Full TypeScript support ensures type safety throughout the system, catching errors at compile time and providing excellent developer experience with IDE support.

### Dynamic Planning

Unlike fixed workflow systems, this framework generates execution plans dynamically based on user goals and available capabilities, enabling flexible and adaptive behavior.

### LangGraph Integration

By leveraging LangGraph for execution, the framework benefits from a mature, battle-tested execution engine while maintaining the flexibility of dynamic planning.

### Simplicity

Focus on the core value proposition - dynamic planning - without over-engineering resource management, optimization, or monitoring systems that can be added later as needed.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any improvements.

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] **Enhanced Planning Algorithms** - More sophisticated task generation and dependency analysis
- [ ] **Visual Graph Editor** - Browser-based workflow design and debugging tools
- [ ] **Plugin Ecosystem** - Standardized plugin architecture for capabilities
- [ ] **Multi-Agent Coordination** - Framework for coordinating multiple planning agents
- [ ] **Performance Analytics** - Basic performance analysis and optimization tools
- [ ] **WebSocket Support** - Real-time bidirectional communication

## Architecture Decisions

### Why TypeScript?

TypeScript provides compile-time type safety, excellent IDE support, and helps prevent runtime errors in complex agent systems.

### Why Capability-Based Design?

Capability-based design allows for:
- Modular agent composition
- Clear separation of concerns
- Easy testing and mocking
- Runtime capability introspection

### Why Dynamic Planning?

Dynamic planning enables:
- Adaptive behavior based on user goals
- Optimal use of available capabilities
- Flexible task composition
- Context-aware execution strategies

### Why LangGraph Integration?

LangGraph integration provides:
- Battle-tested execution engine
- Built-in checkpointing and streaming
- Rich ecosystem of tools and integrations
- Visual debugging capabilities
- Mature error handling and recovery