import { useQuery } from '@tanstack/react-query'
import { fetchCurrentUser } from '@/api/auth'
import { useApiClient } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'

export function useCurrentUser() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn)
  const isLoaded = useAuthStore((s) => s.isLoaded)
  const client = useApiClient()

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await fetchCurrentUser(client)
      if (!res.success || !res.data) {
        throw new Error(res.message ?? 'Failed to load user')
      }
      return res.data
    },
    enabled: isLoaded && !!isSignedIn,
    staleTime: 60_000,
  })
}
