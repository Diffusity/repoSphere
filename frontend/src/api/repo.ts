import type { AxiosInstance } from 'axios'
import type { 
  Repository, 
  ApiResponse, 
  ActivityItem, 
  UserStats, 
  TreeEntry, 
  BlobResponse,
  Commit,
  DiffFile,
  PullRequest,
  PullRequestDetail
} from '@/types'

export interface BranchInfo {
  name: string
  headCommitHash: string | null
  updatedAt: string
}

export async function createRepository(
  client: AxiosInstance, 
  formData: FormData
) {
  const { data } = await client.post<ApiResponse<{ id: string; name: string }>>(
    '/api/v1/repo',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function fetchUserRepositories(client: AxiosInstance, username: string) {
  const { data } = await client.get<ApiResponse<Repository[]>>(`/api/v1/repo/user-repos/${encodeURIComponent(username)}`)
  return data
}

export async function fetchUserActivity(client: AxiosInstance, username: string, limit = 10) {
  const { data } = await client.get<ApiResponse<ActivityItem[]>>(
    `/api/v1/repo/user-repos/${encodeURIComponent(username)}/activity?limit=${limit}`
  )
  return data
}

export async function fetchUserStats(client: AxiosInstance, username: string) {
  const { data } = await client.get<ApiResponse<UserStats>>(`/api/v1/repo/user-repos/${encodeURIComponent(username)}/stats`)
  return data
}

export interface ContributionData {
  contributions: Record<string, number>
  startDate: string
  endDate: string
  totalCommits: number
}

export async function fetchUserContributions(client: AxiosInstance, username: string) {
  const { data } = await client.get<ApiResponse<ContributionData>>(
    `/api/v1/repo/user-repos/${encodeURIComponent(username)}/contributions`
  )
  return data
}

export async function fetchExploreRepositories(
  client: AxiosInstance, 
  options: { search?: string; language?: string } = {}
) {
  const { search, language } = options
  let url = '/api/v1/repo/explore'
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (language) params.append('language', language)
  if (params.toString()) url += `?${params.toString()}`

  const { data } = await client.get<ApiResponse<Repository[]>>(url)
  return data
}

export async function fetchRepository(client: AxiosInstance, owner: string, name: string) {
  const { data } = await client.get<ApiResponse<Repository>>(`/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`)
  return data
}

export async function fetchRepositoryTree(
  client: AxiosInstance, 
  owner: string, 
  name: string, 
  branch: string, 
  path = ''
) {
  const url = path 
    ? `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/tree/${encodeURIComponent(branch)}/${path}`
    : `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/tree/${encodeURIComponent(branch)}`
  const { data } = await client.get<ApiResponse<TreeEntry[]>>(url)
  return data
}

export async function fetchBranches(client: AxiosInstance, owner: string, name: string) {
  const { data } = await client.get<ApiResponse<BranchInfo[]>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/branches`
  )
  return data
}

export async function fetchBlobContent(
  client: AxiosInstance, 
  owner: string, 
  name: string, 
  branch: string, 
  path: string
) {
  const { data } = await client.get<ApiResponse<BlobResponse>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/blob/${encodeURIComponent(branch)}/${path}`
  )
  return data
}

export async function fetchCommits(
  client: AxiosInstance, 
  owner: string, 
  name: string, 
  branch: string,
  page = 1,
  limit = 20
) {
  const { data } = await client.get<ApiResponse<Commit[]>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits/${encodeURIComponent(branch)}?page=${page}&limit=${limit}`
  )
  return data
}

export async function fetchCommitDetail(
  client: AxiosInstance, 
  owner: string, 
  name: string, 
  hash: string
) {
  const { data } = await client.get<ApiResponse<Commit>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commit/${hash}`
  )
  return data
}

export async function fetchCommitDiff(
  client: AxiosInstance, 
  owner: string, 
  name: string, 
  hash: string
) {
  const { data } = await client.get<ApiResponse<DiffFile[]>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commit/${hash}/diff`
  )
  return data
}

export async function deleteRepository(client: AxiosInstance, owner: string, name: string) {
  const { data } = await client.delete<ApiResponse<void>>(`/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`)
  return data
}

export async function updateRepository(
  client: AxiosInstance,
  owner: string,
  name: string,
  payload: {
    name?: string
    description?: string
    visibility?: 'public' | 'private'
    default_branch?: string
  }
) {
  const { data } = await client.patch<ApiResponse<Repository>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    payload
  )
  return data
}

export async function confirmDeleteRepository(
  client: AxiosInstance,
  owner: string,
  name: string,
  confirmationName: string
) {
  const { data } = await client.post<ApiResponse<void>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/confirm-delete`,
    { confirmation_name: confirmationName }
  )
  return data
}

export async function toggleStar(client: AxiosInstance, owner: string, name: string) {
  const { data } = await client.post<ApiResponse<{ starred: boolean; stars: number }>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/star`
  )
  return data
}

export async function checkStar(client: AxiosInstance, owner: string, name: string) {
  const { data } = await client.get<ApiResponse<{ starred: boolean; stars: number }>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/star`
  )
  return data
}

export async function forkRepository(client: AxiosInstance, owner: string, name: string) {
  const { data } = await client.post<ApiResponse<Repository>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/fork`
  )
  return data
}

export async function fetchStarredRepositories(client: AxiosInstance, username: string) {
  const { data } = await client.get<ApiResponse<Repository[]>>(`/api/v1/repo/user-repos/${encodeURIComponent(username)}/starred`)
  return data
}

// --- Pull Requests ---

export async function createPullRequest(
  client: AxiosInstance,
  owner: string,
  name: string,
  payload: { title: string; description: string; base_branch: string; compare_branch: string }
) {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('description', payload.description || '')
  formData.append('base_branch', payload.base_branch)
  formData.append('compare_branch', payload.compare_branch)

  const { data } = await client.post<ApiResponse<PullRequest>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function fetchPullRequests(client: AxiosInstance, owner: string, name: string) {
  const { data } = await client.get<ApiResponse<PullRequest[]>>(`/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls`)
  return data
}

export async function fetchPullRequestDetail(client: AxiosInstance, owner: string, name: string, number: number) {
  const { data } = await client.get<ApiResponse<PullRequestDetail>>(`/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls/${number}`)
  return data
}

export async function mergePullRequest(client: AxiosInstance, owner: string, name: string, number: number) {
  const { data } = await client.post<ApiResponse<PullRequest>>(`/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls/${number}/merge`)
  return data
}
