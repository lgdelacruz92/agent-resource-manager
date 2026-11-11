export interface TicketData {
  id: number
  vikunjaTaskId: number
  title: string
  status: 'Ready' | 'In progress' | 'Retry' | 'Done' | 'Flagged tickets'
  priority: number
  presentOnBoard: boolean
}

export interface TicketModelInterface extends TicketData {
  get(): Promise<TicketData | null>
  create(): Promise<TicketModelInterface>
  update(ticket: TicketModelInterface): Promise<void>
  delete(): Promise<void>
}
