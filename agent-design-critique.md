# Agent Design Critique & LLM Implementation

## Critique of Current Design

### Strengths

1. **Generic Type Safety**: The use of generics for `In`, `Out`, `Event`, and `Signal` provides excellent type safety and flexibility
2. **Consistent Interface**: `Runnable` as a base interface creates a consistent pattern across Task and Agent
3. **Clear Separation**: Tasks are Promise-based, Agents are AsyncGenerator-based - good separation of concerns
4. **Event/Signal Model**: The AsyncGenerator's third parameter for signals creates a clean bidirectional communication channel

### Areas for Improvement

1. **Workflow-Task Relationship**: `SubTask` references dependencies by string, but there's no type-safe way to ensure these dependencies exist or match types
2. **Missing Execution Context**: No way to pass execution context, metadata, or configuration
3. **No Error Handling**: No explicit error handling patterns in the interfaces
4. **Workflow Execution**: `Workflow` is just a collection of subtasks with no execution logic
5. **Signal Type Mismatch**: `Signal extends {}` but AsyncGenerator expects the signal type to match what `next()` receives

### Suggested Improvements

```typescript
// Fix signal constraint
export interface Agent<
  In extends NamedParams = {},
  Out = any,
  Event extends {} = {},
  Signal = any, // Remove constraint to allow any signal type
> extends Runnable<In, AsyncGenerator<Event, Out, Signal>> {
  id: string
  name: string
}

// Add execution context
export interface ExecutionContext {
  sessionId: string
  metadata?: Record<string, any>
  cancellationToken?: AbortSignal
}

// Improve workflow with type-safe dependencies
export interface Workflow<T extends Record<string, NamedParams> = {}> {
  subtasks: {
    [K in keyof T]: SubTask<T[K]> & {
      dependencies: (keyof T)[] // Type-safe dependency references
    }
  }
  execute(input: NamedParams, context?: ExecutionContext): Promise<any>
}
```

## LLM Agent Implementation

Here's how this design could be used to implement an LLM agent:

### 1. LLM-Specific Types

```typescript
// LLM Input
interface LLMInput extends NamedParams {
  prompt: string
  temperature?: number
  maxTokens?: number
  tools?: ToolDefinition[]
}

// LLM Events (streaming output)
type LLMEvent = 
  | { type: 'thought', content: string, reasoning?: string }
  | { type: 'tool_call', id: string, name: string, args: Record<string, any> }
  | { type: 'text_chunk', content: string }
  | { type: 'finish_reason', reason: 'stop' | 'length' | 'tool_calls' }

// LLM Output (final result)
interface LLMOutput {
  content: string
  toolCalls?: ToolCall[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// LLM Signals (external inputs)
type LLMSignal = 
  | { type: 'tool_result', toolCallId: string, result: any, error?: Error }
  | { type: 'interrupt', message: string }
  | { type: 'cancel' }
```

### 2. LLM Agent Implementation

```typescript
class OpenAIAgent implements Agent<LLMInput, LLMOutput, LLMEvent, LLMSignal> {
  id: string
  name: string
  
  constructor(id: string, name: string, private apiKey: string) {
    this.id = id
    this.name = name
  }
  
  async *run(input: LLMInput): AsyncGenerator<LLMEvent, LLMOutput, LLMSignal> {
    const pendingToolCalls = new Map<string, ToolCall>()
    
    // Start streaming chat completion
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: input.prompt }],
      tools: input.tools,
      stream: true,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens
    })
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      
      if (delta?.content) {
        yield { type: 'text_chunk', content: delta.content }
      }
      
      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          // Emit tool call event
          yield {
            type: 'tool_call',
            id: toolCall.id,
            name: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments)
          }
          
          pendingToolCalls.set(toolCall.id, toolCall)
        }
        
        // Wait for tool results
        while (pendingToolCalls.size > 0) {
          const signal = yield // Pause and wait for signal
          
          if (signal?.type === 'tool_result') {
            const toolCall = pendingToolCalls.get(signal.toolCallId)
            if (toolCall) {
              // Process tool result and continue
              pendingToolCalls.delete(signal.toolCallId)
              // Add tool result to conversation context
            }
          }
          
          if (signal?.type === 'cancel') {
            throw new Error('LLM execution cancelled')
          }
        }
      }
      
      if (chunk.choices[0]?.finish_reason) {
        yield { type: 'finish_reason', reason: chunk.choices[0].finish_reason }
      }
    }
    
    // Return final result
    return {
      content: 'Final response content',
      toolCalls: Array.from(pendingToolCalls.values()),
      usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 }
    }
  }
}
```

### 3. Usage Example

```typescript
// Create LLM agent
const llmAgent = new OpenAIAgent('llm-1', 'Research Assistant', 'sk-...')

// Run with streaming
const generator = llmAgent.run({
  prompt: 'Research quantum computing and create a summary',
  temperature: 0.7,
  tools: [webSearchTool, calculatorTool]
})

// Handle streaming events
for await (const event of generator) {
  switch (event.type) {
    case 'thought':
      console.log('🤔 Thinking:', event.content)
      break
      
    case 'tool_call':
      console.log('🔧 Tool call:', event.name, event.args)
      
      // Execute tool
      const result = await executeTool(event.name, event.args)
      
      // Send result back
      generator.next({
        type: 'tool_result',
        toolCallId: event.id,
        result
      })
      break
      
    case 'text_chunk':
      process.stdout.write(event.content)
      break
      
    case 'finish_reason':
      console.log('✅ Finished:', event.reason)
      break
  }
}

// Get final result
const finalResult = await generator.next()
console.log('Final result:', finalResult.value)
```

### 4. Workflow Integration

```typescript
// Define workflow with LLM agent
const researchWorkflow: Workflow<{
  research: LLMInput
  summarize: LLMInput
}> = {
  subtasks: {
    research: {
      dependencies: [],
      options: { 
        prompt: 'Research quantum computing developments',
        tools: [webSearchTool]
      },
      run: async (input) => llmAgent.run(input)
    },
    summarize: {
      dependencies: ['research'],
      options: {
        prompt: 'Summarize the research findings: ${research.output}',
        maxTokens: 500
      },
      run: async (input) => llmAgent.run(input)
    }
  }
}

// Execute workflow
const result = await researchWorkflow.execute({
  topic: 'quantum computing'
})
```

## Key Benefits of This Design

1. **Type Safety**: Full TypeScript support with generic constraints
2. **Streaming First**: AsyncGenerator enables real-time interaction
3. **Composable**: Agents can be combined in workflows
4. **Extensible**: Easy to add new event types, signals, or agent implementations
5. **Testable**: Clean interfaces make mocking and testing straightforward

## Potential Challenges

1. **Complexity**: The generic types might be overwhelming for simple use cases
2. **Signal Handling**: Managing the bidirectional communication requires careful state management
3. **Error Propagation**: Need clear patterns for error handling in streaming context
4. **Resource Management**: No built-in resource cleanup or cancellation patterns

## Recommendations

1. **Add Helper Types**: Create common type aliases for typical use cases
2. **Implement Base Classes**: Provide abstract base classes to simplify implementation
3. **Error Handling**: Add explicit error event types and standardized error handling
4. **Resource Management**: Add cleanup hooks and cancellation token support
5. **Documentation**: Provide comprehensive examples and patterns for common scenarios