import { create } from 'zustand'
import {
  fetchCurrentUser,
  loginWithCredentials,
  logout as logoutRequest,
  registerUser,
  type AuthUserResponse,
} from '@/api/auth'
import { apiClient } from '@/api/client'
import type { User } from '@/types'

type LoginResult =
  | { success: true }
  | { success: false; needsVerification: true; email: string }

interface AuthState {
  user: User | null
  isLoaded: boolean
  isSignedIn: boolean
  isLoading: boolean
  init: () => Promise<void>
  refreshUser: () => Promise<void>
  login: (email: string, password: string) => Promise<LoginResult>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; email: string }>
  logout: () => Promise<void>
  loginWithGoogle: () => void
}

function extractUser(data: AuthUserResponse): User | null {
  if (!data.success || !data.data?.user) return null
  return data.data.user
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoaded: false,
  isSignedIn: false,
  isLoading: false,

  init: async () => {
    if (get().isLoaded || get().isLoading) return
    set({ isLoading: true })
    try {
      const me = await fetchCurrentUser(apiClient)
      const user = extractUser(me)
      set({ user, isSignedIn: !!user, isLoaded: true, isLoading: false })
    } catch {
      set({ user: null, isSignedIn: false, isLoaded: true, isLoading: false })
    }
  },

  refreshUser: async () => {
    try {
      const me = await fetchCurrentUser(apiClient)
      const user = extractUser(me)
      set({ user, isSignedIn: !!user })
    } catch {
      set({ user: null, isSignedIn: false })
    }
  },

  login: async (email: string, password: string) => {
    const res = await loginWithCredentials(apiClient, email, password)
    if (res.success) {
      await get().refreshUser()
      return { success: true }
    }

    if (res.data?.needsVerification) {
      return { success: false, needsVerification: true, email: res.data.email ?? email }
    }

    return { success: false, needsVerification: true, email }
  },

  register: async (name: string, email: string, password: string) => {
    const res = await registerUser(apiClient, name, email, password)
    return { success: !!res.success, email: res.data?.email ?? email }
  },

  logout: async () => {
    await logoutRequest(apiClient)
    set({ user: null, isSignedIn: false })
  },

  loginWithGoogle: () => {
    const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:6020'
    window.location.href = `${baseURL}/api/v1/auth/google`
  },
}))
