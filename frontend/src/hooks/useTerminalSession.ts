import { useMutation, useQuery } from '@tanstack/react-query'
import { createTerminalSession, pollTerminalSession } from '@/api/auth'
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
      return valid === 'active' ? false : 2000
    },
  })
}
