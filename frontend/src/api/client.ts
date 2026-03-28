import { useAuth } from '@clerk/clerk-react'
import axios, { type AxiosInstance } from 'axios'
import { useMemo } from 'react'

function createApiClient(getToken: () => Promise<string | null>): AxiosInstance {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:6020',
    headers: { 'Content-Type': 'application/json' },
  })
  instance.interceptors.request.use(async (config) => {
    const token = await getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
  return instance
}

/** Axios instance with Clerk Bearer token on each request. */
export function useApiClient() {
  const { getToken } = useAuth()
  return useMemo(() => createApiClient(getToken), [getToken])
}
