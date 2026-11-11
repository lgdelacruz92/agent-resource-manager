import type { TicketModelInterface } from "./ticket-model.interface.js"

export interface TicketsInterface {
  find(ticketId: number): TicketModelInterface | undefined
  list(): Promise<TicketModelInterface[]>
}
