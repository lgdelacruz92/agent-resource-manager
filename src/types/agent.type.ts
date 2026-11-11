// The URL identifies the OpenCode server; existing databases may need a schema update.
export interface Agent {
  id: number
  name: string
  status: string
  url: string | null
}