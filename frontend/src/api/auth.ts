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

export interface BasicAuthResponse {
  success: boolean
  data?: {
    user?: User
    needsVerification?: boolean
    email?: string
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

export async function checkUsernameAvailable(client: AxiosInstance, username: string) {
  const { data } = await client.get<{ success: boolean; data: { available: boolean } }>(
    `/api/v1/auth/username/available/${username}`
  )
  return data
}

export async function setUsername(client: AxiosInstance, username: string) {
  const { data } = await client.post<{ success: boolean; data: User; message: string }>(
    '/api/v1/auth/username',
    { username }
  )
  return data
}

export async function fetchCurrentUser(client: AxiosInstance) {
  const { data } = await client.get<AuthUserResponse>('/api/v1/auth/user')
  return data
}

export async function loginWithCredentials(client: AxiosInstance, email: string, password: string) {
  const { data } = await client.post<BasicAuthResponse>('/api/v1/auth/login', { email, password })
  return data
}

export async function registerUser(client: AxiosInstance, name: string, email: string, password: string) {
  const { data } = await client.post<{ success: boolean; data?: { email: string }; message?: string }>(
    '/api/v1/auth/register',
    { name, email, password }
  )
  return data
}

export async function verifyEmailOtp(client: AxiosInstance, email: string, otp: string) {
  const { data } = await client.post<BasicAuthResponse>('/api/v1/auth/verify-email', { email, otp })
  return data
}

export async function resendVerificationOtp(client: AxiosInstance, email: string) {
  const { data } = await client.post<{ success: boolean; message?: string }>('/api/v1/auth/resend-otp', { email })
  return data
}

export async function forgotPassword(client: AxiosInstance, email: string) {
  const { data } = await client.post<{ success: boolean; message?: string }>('/api/v1/auth/forgot-password', { email })
  return data
}

export async function resetPassword(client: AxiosInstance, email: string, otp: string, newPassword: string) {
  const { data } = await client.post<BasicAuthResponse>('/api/v1/auth/reset-password', {
    email,
    otp,
    newPassword,
  })
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

export async function completeTerminalSession(client: AxiosInstance, token: string) {
  const { data } = await client.post<{ success: boolean; message: string }>(
    `/api/v1/auth/session/${token}`
  )
  return data
}

export async function logout(client: AxiosInstance) {
  const { data } = await client.post<{ success: boolean; message: string }>('/api/v1/auth/logout')
  return data
}
