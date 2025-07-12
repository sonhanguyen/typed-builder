import { Task, TaskResult, Plan } from './agent'
import { Agent } from './task-manager'

export class LLMAgent extends Agent {
  protected async executeTask(params: any): Promise<any> {
    // TODO: Implement actual LLM API call
    throw new Error('LLM execution not implemented')
  }
}

export class ShellAgent extends Agent {
  protected async executeTask(params: any): Promise<any> {
    // TODO: Implement shell command execution
    throw new Error('Shell execution not implemented')
  }
}

export class AgentRegistry {
  private agents = new Map<string, Agent>()

  register(type: string, agent: Agent): void {
    this.agents.set(type, agent)
  }

  get(type: string): Agent | undefined {
    return this.agents.get(type)
  }

  has(type: string): boolean {
    return this.agents.has(type)
  }

  getAll(): Map<string, Agent> {
    return this.agents
  }
}

export class AgentPool {
  private agentRegistry: AgentRegistry

  constructor(agentRegistry: AgentRegistry) {
    this.agentRegistry = agentRegistry
  }

  start(): void {
    this.agentRegistry.getAll().forEach(agent => agent.start())
  }

  stop(): void {
    this.agentRegistry.getAll().forEach(agent => agent.stop())
  }

  async processTask(task: Task): Promise<TaskResult> {
    const agent = this.agentRegistry.get(task.executor)
    if (!agent) {
      throw new Error(`Unknown executor type: ${task.executor}`)
    }
    
    if (!agent.isRunning()) {
      throw new Error(`Agent for ${task.executor} is not running`)
    }
    
    return agent.processTask(task)
  }

  getAgentCount(): number {
    return this.agentRegistry.getAll().size
  }

  getRunningAgentCount(): number {
    return Array.from(this.agentRegistry.getAll().values())
      .filter(agent => agent.isRunning()).length
  }
}