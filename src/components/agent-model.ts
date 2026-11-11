import { DatabaseSync } from "node:sqlite";
import type { AgentModelInterface } from "../interfaces/agent-model.interface.js"

export class AgentModel implements AgentModelInterface {
  id = 0
  name = ""
  status = ""
  url: string | null = null

  constructor(private readonly db: DatabaseSync){}

  async update(status: string): Promise<void> {
    if (!this.db) {
      throw Error('No db');
    }
    const result = this.db.prepare("UPDATE agents SET status = ? WHERE id = ?").run(status, this.id);
    if (result.changes !== 1) {
      throw new Error(`Agent ${this.id} was not found`)
    }
  }
}
