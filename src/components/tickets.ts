import type { TicketModelInterface } from "../interfaces/ticket-model.interface.js"
import type { TicketsInterface } from "../interfaces/tickets.interface.js"

export class Tickets implements TicketsInterface {
  constructor(private readonly tickets: TicketModelInterface[] = [],
  ) {}

  find(ticketId: number): TicketModelInterface | undefined {
    return this.tickets.find((ticket) => ticket.id === ticketId)
  }

  async list(): Promise<TicketModelInterface[]> {
    return this.tickets
  }
}
