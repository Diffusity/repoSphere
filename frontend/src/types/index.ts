export interface User {
  _id: string
  googleId?: string | null
  username: string | null
  name: string
  email: string
  provider: 'email' | 'google'
  hasPassword?: boolean
  emailVerified?: boolean
  imageUrl: string | null
  admin: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  page: number
  totalPages: number
  total: number
}

export interface TreeResponse {
  data: TreeEntry[]
}

export interface BlobResponse {
  content: string
  encoding: 'utf-8' | 'base64'
  size: number
}

export interface ActivityItem {
  user: string
  message: string
  hash: string
  time: string
  repo: string
}

export interface UserStats {
  repoCount: number
  commitsToday: number
  contributors: number
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
  ownerId: string
  ownerUsername: string
  description: string
  visibility: 'public' | 'private'
  stars: number
  forks: number
  language: string
  updatedAt: string
  defaultBranch: string
  latestCommit: CommitSummary
  forkedFrom?: {
    id: string
    name: string
    ownerUsername: string
  }
  sourceDeleted?: boolean
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
