export interface AgentModelInterface {
    id: number
    name: string
    status: string
    url: string | null

    update(status: string): Promise<void>
}
