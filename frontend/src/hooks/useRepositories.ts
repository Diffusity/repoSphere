import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/api/client'
import { fetchUserRepositories, fetchExploreRepositories } from '@/api/repo'

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
