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
  fetchUserStats,
  fetchUserContributions,
  updateRepository,
  confirmDeleteRepository,
  fetchBranches,
  toggleStar,
  checkStar,
  forkRepository,
  createPullRequest,
  fetchPullRequests,
  fetchPullRequestDetail,
  mergePullRequest
} from '@/api/repo'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import type { Repository } from '@/types'

type UpdateRepositoryPayload = {
  name?: string
  description?: string
  visibility?: Repository['visibility']
  default_branch?: string
}

export function useRepository(owner: string, name: string) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['repository', owner, name],
    queryFn: () => fetchRepository(client, owner, name),
    enabled: !!owner && !!name,
  })
}

export function useBranches(owner: string, name: string) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['branches', owner, name],
    queryFn: () => fetchBranches(client, owner, name),
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

export function useUserContributions(username: string) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['user-contributions', username],
    queryFn: () => fetchUserContributions(client, username),
    enabled: !!username,
  })
}

export function useUpdateRepository() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      owner, 
      name, 
      payload 
    }: { 
      owner: string; 
      name: string; 
      payload: UpdateRepositoryPayload
    }) => updateRepository(client, owner, name, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['repository', variables.owner, variables.name] })
      // If name changed, we might need to invalidate more, but the redirect will handle it usually
    },
  })
}

export function useConfirmDeleteRepository() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      owner, 
      name, 
      confirmationName 
    }: { 
      owner: string; 
      name: string; 
      confirmationName: string 
    }) => confirmDeleteRepository(client, owner, name, confirmationName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
    },
  })
}

export function useStarStatus(owner: string, name: string) {
  const client = useApiClient()
  const user = useAuthStore((s) => s.user)
  
  return useQuery({
    queryKey: ['star', owner, name],
    queryFn: () => checkStar(client, owner, name),
    enabled: !!owner && !!name && !!user,
  })
}

export function useToggleStar() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ owner, name }: { owner: string; name: string }) =>
      toggleStar(client, owner, name),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['star', variables.owner, variables.name] })
      queryClient.invalidateQueries({ queryKey: ['repository', variables.owner, variables.name] })
    },
  })
}

export function useForkRepository() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ owner, name }: { owner: string; name: string }) =>
      forkRepository(client, owner, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
    },
  })
}

// --- Pull Request Hooks ---

export function usePullRequests(owner: string, name: string) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['pulls', owner, name],
    queryFn: () => fetchPullRequests(client, owner, name),
    enabled: !!owner && !!name,
  })
}

export function usePullRequestDetail(owner: string, name: string, number: number) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['pull', owner, name, number],
    queryFn: () => fetchPullRequestDetail(client, owner, name, number),
    enabled: !!owner && !!name && !!number,
  })
}

export function useCreatePullRequest() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      owner, 
      name, 
      payload 
    }: { 
      owner: string; 
      name: string; 
      payload: { title: string; description: string; base_branch: string; compare_branch: string } 
    }) => createPullRequest(client, owner, name, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pulls', variables.owner, variables.name] })
    },
  })
}

export function useMergePullRequest() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ owner, name, number }: { owner: string; name: string; number: number }) =>
      mergePullRequest(client, owner, name, number),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pull', variables.owner, variables.name, variables.number] })
      queryClient.invalidateQueries({ queryKey: ['pulls', variables.owner, variables.name] })
      queryClient.invalidateQueries({ queryKey: ['branches', variables.owner, variables.name] })
      queryClient.invalidateQueries({ queryKey: ['commits', variables.owner, variables.name] })
    },
  })
}
