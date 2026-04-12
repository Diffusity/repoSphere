import type { AxiosInstance } from 'axios'
import type { 
  Repository, 
  ApiResponse, 
  ActivityItem, 
  UserStats, 
  TreeEntry, 
  BlobResponse,
  CommitSummary
} from '@/types'

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
  const { data } = await client.get<ApiResponse<Repository[]>>(`/api/v1/repo/user/${username}`)
  return data
}

export async function fetchUserActivity(client: AxiosInstance, username: string, limit = 10) {
  const { data } = await client.get<ApiResponse<ActivityItem[]>>(
    `/api/v1/repo/user/${username}/activity?limit=${limit}`
  )
  return data
}

export async function fetchUserStats(client: AxiosInstance, username: string) {
  const { data } = await client.get<ApiResponse<UserStats>>(`/api/v1/repo/user/${username}/stats`)
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
  const { data } = await client.get<ApiResponse<Repository>>(`/api/v1/repo/${owner}/${name}`)
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
    ? `/api/v1/repo/${owner}/${name}/tree/${branch}/${path}`
    : `/api/v1/repo/${owner}/${name}/tree/${branch}`
  const { data } = await client.get<ApiResponse<TreeEntry[]>>(url)
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
    `/api/v1/repo/${owner}/${name}/blob/${branch}/${path}`
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
  const { data } = await client.get<ApiResponse<CommitSummary[]>>(
    `/api/v1/repo/${owner}/${name}/commits/${branch}?page=${page}&limit=${limit}`
  )
  return data
}

export async function fetchCommitDetail(
  client: AxiosInstance, 
  owner: string, 
  name: string, 
  hash: string
) {
  const { data } = await client.get<ApiResponse<any>>(
    `/api/v1/repo/${owner}/${name}/commit/${hash}`
  )
  return data
}

export async function fetchCommitDiff(
  client: AxiosInstance, 
  owner: string, 
  name: string, 
  hash: string
) {
  const { data } = await client.get<ApiResponse<any[]>>(
    `/api/v1/repo/${owner}/${name}/commit/${hash}/diff`
  )
  return data
}

export async function deleteRepository(client: AxiosInstance, owner: string, name: string) {
  const { data } = await client.delete<ApiResponse<void>>(`/api/v1/repo/${owner}/${name}`)
  return data
}
