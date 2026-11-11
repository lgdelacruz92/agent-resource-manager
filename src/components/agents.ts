import type { AgentsInterface } from "../interfaces/agents.interface.js"
import type { AgentModelInterface } from '../interfaces/agent-model.interface.ts'

// An in-memory stand-in; changes are lost when this instance is discarded.
export class Agents implements AgentsInterface {
  constructor(private readonly agents: AgentModelInterface[] = []) { }
  find(agentId: number): AgentModelInterface | undefined {
    return this.agents.find(a => a.id === agentId);
  }

  async list(): Promise<AgentModelInterface[]> {
    return this.agents;
  }

  async update(agentId: number, status: string): Promise<void> {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) {
      throw Error('No agent found')
    }
    agent.update(status);
  }
}
