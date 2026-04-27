import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApiClient } from '@/api/client'
import { fetchIssues, fetchIssue, createIssue, updateIssue, deleteIssue, addComment } from '@/api/issues'

export function useIssues(owner: string, name: string, status?: string, label?: string, page: number = 1, limit: number = 20) {
  const client = useApiClient()
  return useQuery({
    queryKey: ['issues', owner, name, status, label, page, limit],
    queryFn: () => fetchIssues(client, owner, name, { status, label, page, limit }),
    enabled: !!owner && !!name,
  })
}

export function useIssue(owner: string, name: string, issueNumber: number) {
  const client = useApiClient()
  return useQuery({
    queryKey: ['issue', owner, name, issueNumber],
    queryFn: () => fetchIssue(client, owner, name, issueNumber),
    enabled: !!owner && !!name && !!issueNumber,
  })
}

export function useCreateIssue() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { owner: string; name: string; title: string; body?: string; labels?: string[] }) =>
      createIssue(client, v.owner, v.name, { title: v.title, body: v.body, labels: v.labels }),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['issues', v.owner, v.name] }) },
  })
}

export function useUpdateIssue() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { owner: string; name: string; number: number; title?: string; body?: string; status?: string; labels?: string[] }) =>
      updateIssue(client, v.owner, v.name, v.number, { title: v.title, body: v.body, status: v.status, labels: v.labels }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['issues', v.owner, v.name] })
      qc.invalidateQueries({ queryKey: ['issue', v.owner, v.name, v.number] })
    },
  })
}

export function useDeleteIssue() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { owner: string; name: string; number: number }) =>
      deleteIssue(client, v.owner, v.name, v.number),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['issues', v.owner, v.name] })
    },
  })
}

export function useAddComment() {
  const client = useApiClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { owner: string; name: string; number: number; body: string }) =>
      addComment(client, v.owner, v.name, v.number, v.body),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['issue', v.owner, v.name, v.number] })
    },
  })
}
