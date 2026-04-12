import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApiClient } from '@/api/client'
import { checkUsernameAvailable, setUsername } from '@/api/auth'

export function useUsernameAvailability(username: string) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['username-availability', username],
    queryFn: () => checkUsernameAvailable(client, username),
    enabled: username.length >= 3,
    retry: false,
  })
}

export function useSetUsername() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (username: string) => setUsername(client, username),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      }
    },
  })
}
