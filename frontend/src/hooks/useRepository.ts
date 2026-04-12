import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/api/client'
import { 
  fetchRepository, 
  fetchRepositoryTree, 
  fetchBlobContent, 
  fetchCommits, 
  fetchCommitDetail, 
  fetchCommitDiff,
  fetchUserActivity,
  fetchUserStats
} from '@/api/repo'

export function useRepository(owner: string, name: string) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['repository', owner, name],
    queryFn: () => fetchRepository(client, owner, name),
    enabled: !!owner && !!name,
  })
}

export function useRepositoryTree(owner: string, name: string, branch: string, path = '') {
  const client = useApiClient()

  return useQuery({
    queryKey: ['tree', owner, name, branch, path],
    queryFn: () => fetchRepositoryTree(client, owner, name, branch, path),
    enabled: !!owner && !!name && !!branch,
  })
}

export function useBlobContent(owner: string, name: string, branch: string, path: string) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['blob', owner, name, branch, path],
    queryFn: () => fetchBlobContent(client, owner, name, branch, path),
    enabled: !!owner && !!name && !!branch && !!path,
  })
}

export function useCommits(owner: string, name: string, branch: string, page = 1) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['commits', owner, name, branch, page],
    queryFn: () => fetchCommits(client, owner, name, branch, page),
    enabled: !!owner && !!name && !!branch,
  })
}

export function useCommitDetail(owner: string, name: string, hash: string) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['commit', owner, name, hash],
    queryFn: () => fetchCommitDetail(client, owner, name, hash),
    enabled: !!owner && !!name && !!hash,
  })
}

export function useCommitDiff(owner: string, name: string, hash: string) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['diff', owner, name, hash],
    queryFn: () => fetchCommitDiff(client, owner, name, hash),
    enabled: !!owner && !!name && !!hash,
  })
}

export function useUserActivity(username: string, limit = 10) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['user-activity', username, limit],
    queryFn: () => fetchUserActivity(client, username, limit),
    enabled: !!username,
  })
}

export function useUserStats(username: string) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['user-stats', username],
    queryFn: () => fetchUserStats(client, username),
    enabled: !!username,
  })
}
