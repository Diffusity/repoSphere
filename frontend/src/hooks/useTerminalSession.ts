import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTerminalSession, pollTerminalSession, revokeTerminalSession } from '@/api/auth'
import { useApiClient } from '@/api/client'

export function useCreateTerminalSession() {
  const client = useApiClient()
  return useMutation({
    mutationFn: async () => {
      const res = await createTerminalSession(client)
      if (!res.success || !res.data) {
        throw new Error(res.message ?? 'Could not create session')
      }
      return res.data
    },
  })
}

export function useTerminalSessionPoll(sessionId: string | null) {
  const client = useApiClient()
  return useQuery({
    queryKey: ['terminalSession', sessionId],
    queryFn: async () => pollTerminalSession(client, sessionId!),
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const valid = query.state.data?.data?.valid
      return valid === 'active' || valid === 'deleted' ? false : 2000
    },
  })
}

export function useRevokeTerminalSession() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await revokeTerminalSession(client, sessionId)
      if (!res.success) {
        throw new Error(res.message ?? 'Could not revoke session')
      }
      return res
    },
    onSuccess: async (_, sessionId) => {
      await queryClient.invalidateQueries({ queryKey: ['terminalSession', sessionId] })
    },
  })
}
