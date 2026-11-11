export interface AgentModelInterface {
    id: number
    name: string
    status: 'busy' | 'unreachable'
    url: string

    update(status: string): Promise<void>
}
