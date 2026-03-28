export interface User {
  _id: string
  clerkId: string | null
  name: string
  email: string
  provider: 'email' | 'google'
  imageUrl: string | null
  admin: boolean
}

export interface CommitSummary {
  hash: string
  message: string
  author: string
  timestamp: string
}

export interface Repository {
  id: string
  name: string
  owner: string
  description: string
  visibility: 'public' | 'private'
  stars: number
  forks: number
  language: string
  updatedAt: string
  defaultBranch: string
  latestCommit: CommitSummary
}

export interface Commit extends CommitSummary {
  parent: string
  authorEmail: string
  filesChanged: { path: string; status: 'added' | 'modified' | 'deleted' }[]
  tree?: TreeEntry[]
}

export interface DiffLine {
  type: '+' | '-' | ' '
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export interface DiffHunk {
  oldStart: number
  newStart: number
  lines: DiffLine[]
}

export interface DiffFile {
  path: string
  status: 'added' | 'modified' | 'deleted'
  additions: number
  deletions: number
  hunks: DiffHunk[]
}

export interface TreeEntry {
  name: string
  type: 'file' | 'directory'
  hash?: string
  children?: TreeEntry[]
}

export type TerminalSessionStatus = 'inactive' | 'active'

export interface TerminalSessionState {
  sessionId: string
  token: string
  status: TerminalSessionStatus
}
