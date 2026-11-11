export interface LockData {
  name: string
  owner: string
  acquiredAt: string
}

export interface LockModelInterface extends LockData {
  create(lock: LockData): Promise<LockModelInterface>
  delete(lock: LockData): Promise<void>
}
