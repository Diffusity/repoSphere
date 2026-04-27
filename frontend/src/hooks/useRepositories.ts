import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/api/client'
import { fetchUserRepositories, fetchExploreRepositories, fetchStarredRepositories } from '@/api/repo'

export function useRepositories(username?: string) {
  const client = useApiClient()

  const { data: realRepos, isLoading, isError } = useQuery({
    queryKey: ['repositories', username],
    queryFn: () => {
      if (username) {
        return fetchUserRepositories(client, username)
      } else {
        return fetchExploreRepositories(client)
      }
    },
  })

  return { 
    repositories: realRepos?.success ? realRepos.data : [], 
    isMock: false,
    isLoading,
    isError
  }
}

export function useStarredRepositories(username?: string) {
  const client = useApiClient()

  const { data: realRepos, isLoading, isError } = useQuery({
    queryKey: ['starred-repositories', username],
    queryFn: () => {
      if (username) {
        return fetchStarredRepositories(client, username)
      }
      return Promise.resolve({ success: true, data: [] })
    },
    enabled: !!username,
  })

  return { 
    repositories: realRepos?.success ? realRepos.data : [], 
    isLoading,
    isError
  }
}
