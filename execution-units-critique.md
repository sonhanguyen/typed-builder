# Agent Design Critique: Execution Units & Resource Management

## Critique of Current Design

### Alignment with Execution Unit Philosophy

Your intention to make Agent and Task the core execution units is sound, but the current design has some misalignments:

#### Strengths
1. **Clear Hierarchy**: Agent and Task as distinct execution units makes logical sense
2. **Generic Foundation**: The `Runnable` interface provides a consistent base
3. **Type Safety**: Generic constraints maintain type safety across the execution chain

#### Issues with Current Design

1. **Workflow Self-Execution**: Current `Workflow` having `subtasks` suggests it might execute itself, contradicting your intention
2. **Missing Worker Concept**: No worker abstraction for resource-bound task execution
3. **Agent-Workflow Relationship**: Unclear how agents consume and execute workflows
4. **Resource Binding**: No mechanism to bind tasks to specific resource types

### Proposed Design Changes

```typescript
type NamedParams = Record<string, any>

interface Runnable<In extends NamedParams = {}, Out = any> {
  run(_: In): Out
}

// Task: Executed by Workers (resource-bound)
export interface Task<
  In extends NamedParams = {},
  Out = any
> extends Runnable<In, Promise<Out>> {
  id: string
  name: string
  resourceRequirements: ResourceRequirement[]
}

// Agent: Executes Workflows (orchestration unit)
export interface Agent<
  In extends NamedParams = {},
  Out = any,
  Event extends {} = {},
  Signal = any,
> extends Runnable<In, AsyncGenerator<Event, Out, Signal>> {
  id: string
  name: string
  executeWorkflow(workflow: Workflow, input: In): AsyncGenerator<Event, Out, Signal>
}

// Workflow: Passive definition executed by Agents
export interface Workflow<T extends Record<string, NamedParams> = {}> {
  id: string
  name: string
  tasks: {
    [K in keyof T]: TaskDefinition<T[K]> & {
      dependencies: (keyof T)[]
    }
  }
  // No execute method - workflows are passive
}

// Worker: Executes Tasks (resource-bound)
export interface Worker<ResourceType extends Resource = Resource> {
  id: string
  name: string
  resources: ResourceType[]
  canExecute(task: Task): boolean
  execute<T extends Task>(task: T): Promise<Awaited<ReturnType<T['run']>>>
}

// Resource: Bound to Workers
export interface Resource {
  id: string
  type: string
  status: 'available' | 'busy' | 'offline'
  metadata?: Record<string, any>
}

export interface ResourceRequirement {
  type: string
  constraints?: Record<string, any>
}
```

## LLM Agent Implementation Example

### 1. Resource Types

```typescript
// Browser resource for web-based tasks
interface BrowserResource extends Resource {
  type: 'browser'
  metadata: {
    browserType: 'chrome' | 'firefox' | 'safari'
    version: string
    headless: boolean
    url?: string
  }
}

// Code execution sandbox
interface SandboxResource extends Resource {
  type: 'sandbox'
  metadata: {
    language: 'python' | 'javascript' | 'bash'
    timeout: number
    memoryLimit: number
    workingDirectory?: string
  }
}

// LLM API resource
interface LLMResource extends Resource {
  type: 'llm'
  metadata: {
    provider: 'openai' | 'anthropic' | 'local'
    model: string
    apiKey?: string
    baseUrl?: string
    rateLimitRpm?: number
  }
}
```

### 2. Task Implementations

```typescript
// Web search task
class WebSearchTask implements Task<{ query: string }, { results: SearchResult[] }> {
  id = 'web-search'
  name = 'Web Search'
  resourceRequirements = [{ type: 'browser' }]
  
  async run(input: { query: string }): Promise<{ results: SearchResult[] }> {
    // Task implementation - will be executed by BrowserWorker
    throw new Error('Must be executed by worker')
  }
}

// Code execution task
class CodeExecutionTask implements Task<{ code: string, language: string }, { output: string, error?: string }> {
  id = 'code-execution'
  name = 'Code Execution'
  resourceRequirements = [{ type: 'sandbox', constraints: { language: 'python' } }]
  
  async run(input: { code: string, language: string }): Promise<{ output: string, error?: string }> {
    // Task implementation - will be executed by SandboxWorker
    throw new Error('Must be executed by worker')
  }
}

// LLM reasoning task
class LLMReasoningTask implements Task<{ prompt: string, context?: string }, { response: string, toolCalls?: ToolCall[] }> {
  id = 'llm-reasoning'
  name = 'LLM Reasoning'
  resourceRequirements = [{ type: 'llm' }]
  
  async run(input: { prompt: string, context?: string }): Promise<{ response: string, toolCalls?: ToolCall[] }> {
    // Task implementation - will be executed by LLMWorker
    throw new Error('Must be executed by worker')
  }
}
```

### 3. Worker Implementations

```typescript
// Browser worker
class BrowserWorker implements Worker<BrowserResource> {
  id: string
  name: string
  resources: BrowserResource[]
  
  constructor(id: string, resources: BrowserResource[]) {
    this.id = id
    this.name = `Browser Worker ${id}`
    this.resources = resources
  }
  
  canExecute(task: Task): boolean {
    return task.resourceRequirements.some(req => 
      req.type === 'browser' && 
      this.resources.some(r => r.status === 'available')
    )
  }
  
  async execute<T extends Task>(task: T): Promise<Awaited<ReturnType<T['run']>>> {
    const resource = this.resources.find(r => r.status === 'available')
    if (!resource) throw new Error('No available browser resource')
    
    resource.status = 'busy'
    
    try {
      // Execute task using browser resource
      if (task instanceof WebSearchTask) {
        const browser = await this.getBrowser(resource)
        const results = await this.performSearch(browser, task.input.query)
        return { results } as any
      }
      
      throw new Error(`Unsupported task type: ${task.constructor.name}`)
    } finally {
      resource.status = 'available'
    }
  }
  
  private async getBrowser(resource: BrowserResource) {
    // Implementation to get browser instance
  }
  
  private async performSearch(browser: any, query: string): Promise<SearchResult[]> {
    // Implementation to perform search
  }
}

// LLM worker
class LLMWorker implements Worker<LLMResource> {
  id: string
  name: string
  resources: LLMResource[]
  
  constructor(id: string, resources: LLMResource[]) {
    this.id = id
    this.name = `LLM Worker ${id}`
    this.resources = resources
  }
  
  canExecute(task: Task): boolean {
    return task.resourceRequirements.some(req => 
      req.type === 'llm' && 
      this.resources.some(r => r.status === 'available')
    )
  }
  
  async execute<T extends Task>(task: T): Promise<Awaited<ReturnType<T['run']>>> {
    const resource = this.resources.find(r => r.status === 'available')
    if (!resource) throw new Error('No available LLM resource')
    
    resource.status = 'busy'
    
    try {
      if (task instanceof LLMReasoningTask) {
        const response = await this.callLLM(resource, task.input.prompt, task.input.context)
        return { response } as any
      }
      
      throw new Error(`Unsupported task type: ${task.constructor.name}`)
    } finally {
      resource.status = 'available'
    }
  }
  
  private async callLLM(resource: LLMResource, prompt: string, context?: string): Promise<string> {
    // Implementation to call LLM API
  }
}
```

### 4. LLM Agent Implementation

```typescript
// LLM-specific event types
type LLMEvent = 
  | { type: 'thought', content: string }
  | { type: 'task_started', taskId: string }
  | { type: 'task_completed', taskId: string, result: any }
  | { type: 'workflow_progress', completed: number, total: number }

type LLMSignal = 
  | { type: 'interrupt', message: string }
  | { type: 'provide_input', data: any }

interface LLMInput extends NamedParams {
  goal: string
  context?: string
}

interface LLMOutput {
  result: any
  reasoning: string[]
  tasksExecuted: string[]
}

class ResearchAgent implements Agent<LLMInput, LLMOutput, LLMEvent, LLMSignal> {
  id: string
  name: string
  
  constructor(
    id: string,
    name: string,
    private workerPool: WorkerPool,
    private workflows: Map<string, Workflow>
  ) {
    this.id = id
    this.name = name
  }
  
  async *run(input: LLMInput): AsyncGenerator<LLMEvent, LLMOutput, LLMSignal> {
    yield { type: 'thought', content: `Planning approach for goal: ${input.goal}` }
    
    // Select appropriate workflow based on goal
    const workflow = this.selectWorkflow(input.goal)
    
    yield* this.executeWorkflow(workflow, input)
    
    return {
      result: 'Research completed',
      reasoning: ['Selected research workflow', 'Executed tasks sequentially'],
      tasksExecuted: Object.keys(workflow.tasks)
    }
  }
  
  async *executeWorkflow(workflow: Workflow, input: LLMInput): AsyncGenerator<LLMEvent, LLMOutput, LLMSignal> {
    const taskResults = new Map<string, any>()
    const completedTasks = new Set<string>()
    
    while (completedTasks.size < Object.keys(workflow.tasks).length) {
      // Find tasks ready to execute (dependencies satisfied)
      const readyTasks = Object.entries(workflow.tasks)
        .filter(([taskId, taskDef]) => 
          !completedTasks.has(taskId) &&
          taskDef.dependencies.every(dep => completedTasks.has(dep as string))
        )
      
      for (const [taskId, taskDef] of readyTasks) {
        yield { type: 'task_started', taskId }
        
        // Find worker capable of executing this task
        const task = this.createTask(taskDef)
        const worker = this.workerPool.findWorker(task)
        
        if (!worker) {
          throw new Error(`No worker available for task: ${taskId}`)
        }
        
        // Execute task
        const result = await worker.execute(task)
        taskResults.set(taskId, result)
        completedTasks.add(taskId)
        
        yield { type: 'task_completed', taskId, result }
        yield { 
          type: 'workflow_progress', 
          completed: completedTasks.size, 
          total: Object.keys(workflow.tasks).length 
        }
      }
      
      // Check for signals
      const signal = yield
      if (signal?.type === 'interrupt') {
        throw new Error(`Execution interrupted: ${signal.message}`)
      }
    }
    
    return {
      result: taskResults,
      reasoning: ['Executed all workflow tasks'],
      tasksExecuted: Array.from(completedTasks)
    }
  }
  
  private selectWorkflow(goal: string): Workflow {
    // Logic to select appropriate workflow based on goal
    return this.workflows.get('research-workflow')!
  }
  
  private createTask(taskDef: any): Task {
    // Factory method to create task instances
    switch (taskDef.type) {
      case 'web-search':
        return new WebSearchTask()
      case 'llm-reasoning':
        return new LLMReasoningTask()
      default:
        throw new Error(`Unknown task type: ${taskDef.type}`)
    }
  }
}
```

### 5. Usage Example

```typescript
// Create resources
const browserResource: BrowserResource = {
  id: 'browser-1',
  type: 'browser',
  status: 'available',
  metadata: { browserType: 'chrome', version: '120.0', headless: true }
}

const llmResource: LLMResource = {
  id: 'openai-1',
  type: 'llm',
  status: 'available',
  metadata: { provider: 'openai', model: 'gpt-4', apiKey: 'sk-...' }
}

// Create workers
const browserWorker = new BrowserWorker('browser-worker-1', [browserResource])
const llmWorker = new LLMWorker('llm-worker-1', [llmResource])

// Create worker pool
const workerPool = new WorkerPool([browserWorker, llmWorker])

// Define research workflow
const researchWorkflow: Workflow = {
  id: 'research-workflow',
  name: 'Research Workflow',
  tasks: {
    search: {
      type: 'web-search',
      dependencies: [],
      input: { query: 'quantum computing 2024' }
    },
    analyze: {
      type: 'llm-reasoning',
      dependencies: ['search'],
      input: { prompt: 'Analyze these search results: ${search.results}' }
    },
    summarize: {
      type: 'llm-reasoning',
      dependencies: ['analyze'],
      input: { prompt: 'Create a summary: ${analyze.response}' }
    }
  }
}

// Create agent
const researchAgent = new ResearchAgent(
  'research-agent-1',
  'Research Agent',
  workerPool,
  new Map([['research-workflow', researchWorkflow]])
)

// Execute
const generator = researchAgent.run({ 
  goal: 'Research quantum computing developments in 2024' 
})

for await (const event of generator) {
  console.log('Event:', event)
}
```

## Key Benefits of This Design

1. **Clear Separation**: Agents orchestrate, Workers execute, Tasks define work
2. **Resource Management**: Explicit resource binding and availability tracking
3. **Scalability**: Workers can be distributed across different machines/processes
4. **Composability**: Workflows are reusable across different agents
5. **Type Safety**: Full type checking throughout the execution chain

## Challenges & Considerations

1. **Complexity**: More moving parts than a simpler design
2. **Resource Contention**: Need sophisticated scheduling for resource conflicts
3. **Error Handling**: Failures can occur at multiple levels (task, worker, resource)
4. **State Management**: Workflow state needs to be maintained across async operations
5. **Performance**: Overhead of task dispatch and resource management

This design aligns with your intention of making Agent and Task the core execution units, with clear boundaries between orchestration (Agent) and execution (Worker/Task).