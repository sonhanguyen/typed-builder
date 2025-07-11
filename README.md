# Typed Agent Builder

A TypeScript framework for building autonomous agents with streaming execution and composable workflows. This framework provides a type-safe foundation for creating AI agents that can execute tasks through workflows, with support for tool calls, agent composition, and resource management.

## Core Concepts

### Agents
Agents are the fundamental execution units that process input and produce streaming output:

```typescript
interface Agent {
  id: string
  name: string
  run(input: AgentInput): AsyncGenerator<AgentOutput, AgentOutput, AgentEvent>
}
```

- **Input**: Named parameters as an object
- **Output**: Streaming values, ending with final result or error
- **Events**: Bidirectional communication channel (e.g., tool call results)

### LLM Agents
Specialized agents that work with prompts and emit thoughts/tool calls:

```typescript
interface LLMAgent extends Agent {
  run(input: { prompt: string }): AsyncGenerator<LLMAgentOutput, LLMAgentOutput, LLMToolCallResult>
}
```

LLM agents can:
- Stream their reasoning process as thoughts
- Emit tool calls for external execution
- Receive tool call results via events

### Workflows & Tasks
Workflows are execution graphs composed of tasks with dependencies:

```typescript
interface Task {
  id: string
  name: string
  type: 'tool_call' | 'agent_call'
  dependencies: string[]
  input: TaskInput
}

interface Workflow {
  id: string
  name: string
  tasks: Map<string, Task>
  input: Record<string, any>
}
```

Tasks can be:
- **Tool calls**: Execute external tools with parameters
- **Agent calls**: Invoke other agents recursively

### Workers & Resources
Workers execute tasks and are bound to resources:

```typescript
interface Worker {
  id: string
  name: string
  resources: Resource[]
  
  canExecute(task: Task): boolean
  execute(task: Task): Promise<void>
}
```

Resources represent execution environments:
- **Browser**: Web browser instances
- **Sandbox**: Code execution environments
- **Custom**: Domain-specific resources

### Job Management
Jobs represent running agent instances with lifecycle management:

```typescript
interface Job {
  id: string
  agentId: string
  status: JobStatus
  stream(): AsyncGenerator<AgentOutput, AgentOutput, AgentEvent>
  cancel(): Promise<void>
}
```

The `AgentOrchestrator` creates and manages jobs:

```typescript
interface AgentOrchestrator {
  createJob(agent: Agent, input: AgentInput): Promise<Job>
  getJob(jobId: string): Job | null
  cancelJob(jobId: string): Promise<void>
}
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Agents      │    │   Workflows     │    │    Workers      │
│                 │    │                 │    │                 │
│ • LLM Agents    │ -> │ • Tasks         │ -> │ • Resource Mgmt │
│ • Tool Calls    │    │ • Dependencies  │    │ • Execution     │
│ • Streaming I/O │    │ • Agent Calls   │    │ • Scheduling    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         |                       |                       |
    ┌─────────────────────────────────────────────────────────────┐
    │                 Execution Engine                            │
    │                                                             │
    │ • Job Management    • Event Routing    • Progress Tracking │
    └─────────────────────────────────────────────────────────────┘
```

## Key Features

- 🤖 **Streaming Agents** - Agents with real-time streaming output and bidirectional events
- 🔄 **Composable Workflows** - Task graphs with dependency resolution and agent recursion
- ⚡ **Resource Management** - Workers bound to execution resources (browsers, sandboxes)
- 🎯 **Type Safety** - Full TypeScript support with comprehensive type definitions
- 🔧 **Job Control** - Lifecycle management with status tracking and cancellation
- 📊 **Progress Tracking** - Real-time execution monitoring and event streaming

## Quick Start

### Basic Agent Usage

```typescript
import { LLMAgent, AgentOrchestrator } from 'typed-agent-builder'

// Create an LLM agent
const agent: LLMAgent = new MyLLMAgent({
  id: 'research-agent',
  name: 'Research Assistant'
})

// Create orchestrator and run job
const orchestrator = new AgentOrchestrator()
const job = await orchestrator.createJob(agent, { 
  prompt: 'Research the latest developments in quantum computing' 
})

// Stream the results
for await (const output of job.stream()) {
  if (output.thought) {
    console.log('Thinking:', output.thought.content)
  }
  if (output.toolCall) {
    console.log('Tool call:', output.toolCall.toolName)
    
    // Execute tool and send result back
    const result = await executeTool(output.toolCall)
    await job.stream().next({
      id: 'result-1',
      timestamp: new Date(),
      type: 'tool_call_result',
      data: { toolCallId: output.toolCall.id, result }
    })
  }
  if (output.done) {
    console.log('Final result:', output.value)
    break
  }
}
```

### Workflow Execution

```typescript
import { Workflow, Task, ExecutionEngine } from 'typed-agent-builder'

// Define a workflow
const workflow: Workflow = {
  id: 'research-pipeline',
  name: 'Research Pipeline',
  tasks: new Map([
    ['search', {
      id: 'search',
      name: 'Web Search',
      type: 'tool_call',
      dependencies: [],
      input: { query: 'quantum computing 2024' },
      toolName: 'web_search'
    }],
    ['analyze', {
      id: 'analyze', 
      name: 'Analysis',
      type: 'agent_call',
      dependencies: ['search'],
      input: { data: '${search.output}' },
      agent: analysisAgent
    }]
  ]),
  input: { topic: 'quantum computing' }
}

// Execute workflow
const engine = new ExecutionEngine()
for await (const update of engine.executeWorkflow(workflow)) {
  console.log(`Progress: ${update.progress.percentage}%`)
  console.log(`Current task: ${update.currentTask}`)
}
```

### Worker Management

```typescript
import { Worker, BrowserResource, SandboxResource } from 'typed-agent-builder'

// Create workers with resources
const browserWorker: Worker = {
  id: 'browser-1',
  name: 'Browser Worker',
  resources: [{
    id: 'chrome-1',
    type: 'browser',
    status: 'available',
    metadata: {
      browserType: 'chrome',
      version: '120.0.0'
    }
  }]
}

const codeWorker: Worker = {
  id: 'sandbox-1', 
  name: 'Code Execution Worker',
  resources: [{
    id: 'python-env-1',
    type: 'sandbox',
    status: 'available',
    metadata: {
      language: 'python',
      timeout: 30000
    }
  }]
}

// Add to worker pool
const workerPool = new WorkerPool()
workerPool.addWorker(browserWorker)
workerPool.addWorker(codeWorker)
```

## Design Philosophy

### Stream-First Architecture
All agent execution is streaming by default, enabling real-time feedback and interactive experiences.

### Composable by Design
Agents can call other agents recursively, workflows can embed sub-workflows, and components are designed for maximum reusability.

### Resource-Aware Execution
Workers are explicitly bound to resources, enabling proper resource management, scheduling, and isolation.

### Type Safety First
Comprehensive TypeScript types ensure compile-time safety and excellent developer experience.

### Event-Driven Communication
Bidirectional event channels enable complex interactions like tool calls, human-in-the-loop, and agent coordination.

## Documentation

- **[Agent System](./docs/agent.md)** - Core agent interfaces and implementation
- **[Workflow Engine](./docs/workflow.md)** - Task orchestration and dependencies  
- **[Worker Management](./docs/worker.md)** - Resource allocation and execution
- **[Execution System](./docs/execution.md)** - Job management and monitoring

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any improvements.

## License

MIT License - see LICENSE file for details.
