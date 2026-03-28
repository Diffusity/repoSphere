import { useMemo } from 'react'
import type { Repository } from '@/types'
import { mockRepositories } from '@/lib/mockData'

function useMockMode() {
  return import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK !== 'false'
}

export function useRepositories(username?: string): { repositories: Repository[]; isMock: boolean } {
  const mock = useMockMode()
  return useMemo(() => {
    if (!mock) {
      return { repositories: [], isMock: false }
    }
    const list = username
      ? mockRepositories.filter((r) => r.owner === username)
      : [...mockRepositories]
    return { repositories: list, isMock: true }
  }, [mock, username])
}
