import type { AxiosInstance } from 'axios'
import type { User } from '@/types'

export interface AuthUserResponse {
  success: boolean
  data?: {
    sessionId: string
    user: User
  }
  message?: string
}

export interface CreateSessionResponse {
  success: boolean
  data?: {
    sessionId: string
    token: string
  }
  message?: string
}

export interface SessionPollResponse {
  success: boolean
  data?: {
    valid: string
    email: string
    token: string
  }
  message?: string
}

export async function fetchCurrentUser(client: AxiosInstance) {
  const { data } = await client.get<AuthUserResponse>('/api/v1/auth/user')
  return data
}

export async function createTerminalSession(client: AxiosInstance) {
  const { data } = await client.post<CreateSessionResponse>('/api/v1/auth/session')
  return data
}

export async function pollTerminalSession(client: AxiosInstance, sessionId: string) {
  const { data } = await client.get<SessionPollResponse>(`/api/v1/auth/session/${sessionId}`)
  return data
}
