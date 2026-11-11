import { AgentModelInterface } from './agent-model.interface.js';

export interface AgentsInterface {
   find(agentId: number): AgentModelInterface | undefined;
   list(): Promise<AgentModelInterface[]>
   update(agentId: number, status: string): Promise<void>
}