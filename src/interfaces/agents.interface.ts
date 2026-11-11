import { Agent } from '../types/agent.type.js';

export interface AgentsInterface {
   list(): Promise<Agent[]>
   update(agentId: number, status: string): Promise<void>
}