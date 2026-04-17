import axios, { type AxiosInstance } from 'axios'

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:6020',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

export function useApiClient() {
  return apiClient
}
