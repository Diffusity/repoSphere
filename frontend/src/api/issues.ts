import type { AxiosInstance } from 'axios'
import type { ApiResponse, IssuesListData, IssueDetail } from '@/types'

export async function fetchIssues(
  client: AxiosInstance, owner: string, name: string,
  options: { status?: string; label?: string; page?: number; limit?: number } = {}
) {
  const params = new URLSearchParams()
  if (options.status) params.append('status', options.status)
  if (options.label) params.append('label', options.label)
  if (options.page) params.append('page', options.page.toString())
  if (options.limit !== undefined) params.append('limit', options.limit.toString())
  const qs = params.toString() ? `?${params.toString()}` : ''
  const { data } = await client.get<ApiResponse<IssuesListData>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues${qs}`
  )
  return data
}

export async function fetchIssue(
  client: AxiosInstance, owner: string, name: string, issueNumber: number
) {
  const { data } = await client.get<ApiResponse<IssueDetail>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues/${issueNumber}`
  )
  return data
}

export async function createIssue(
  client: AxiosInstance, owner: string, name: string,
  payload: { title: string; body?: string; labels?: string[] }
) {
  const { data } = await client.post<ApiResponse<IssueDetail>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues`, payload
  )
  return data
}

export async function updateIssue(
  client: AxiosInstance, owner: string, name: string, issueNumber: number,
  payload: { title?: string; body?: string; status?: string; labels?: string[] }
) {
  const { data } = await client.patch<ApiResponse<IssueDetail>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues/${issueNumber}`, payload
  )
  return data
}

export async function deleteIssue(
  client: AxiosInstance, owner: string, name: string, issueNumber: number
) {
  const { data } = await client.delete<ApiResponse<{ deleted: boolean }>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues/${issueNumber}`
  )
  return data
}

export async function addComment(
  client: AxiosInstance, owner: string, name: string,
  issueNumber: number, body: string
) {
  const { data } = await client.post<ApiResponse<{ id: string; body: string }>>(
    `/api/v1/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues/${issueNumber}/comments`, { body }
  )
  return data
}
