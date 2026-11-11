// Defines the Vikunja operations the Resource Manager needs.
import type { TicketModelInterface } from "./ticket-model.interface.js"

// Ticket details needed to begin work; more payload fields can be added when agreed.
export interface VikunjaTask {
  id: number
  title: string
  description: string
}

// Columns the Resource Manager is responsible for moving work into.
export type ResourceManagerColumn = "In progress" | "Done" | "Retry"

// Fetches ticket details and moves tickets on the Vikunja board.
export interface VikunjaInterface {
  // Push a ticket's title, priority and status to its existing board task.
  sync(ticket: TicketModelInterface): Promise<void>

  // Fetch a task by its Vikunja task ID; reject if the task cannot be retrieved.
  getTask(taskId: number): Promise<VikunjaTask>

  // Read the current board column; null means the task was not found.
  getTaskColumn(taskId: number): Promise<string | null>

  // Move a task to the requested column; reject if the move cannot be confirmed.
  moveToColumn(taskId: number, column: ResourceManagerColumn): Promise<void>
}
