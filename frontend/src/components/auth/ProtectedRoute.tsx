import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)
  const isLoaded = useAuthStore((s) => s.isLoaded)
  const isSignedIn = useAuthStore((s) => s.isSignedIn)
  const location = useLocation()

  const { data: me, isLoading: userLoading } = useCurrentUser()
  const hasUsername = user?.username || me?.user?.username

  if (!isLoaded || userLoading) return null
  if (!isSignedIn) return <Navigate to="/sign-in" state={{ from: location }} replace />

  return hasUsername ? <Outlet /> : <Navigate to="/setup-username" state={{ from: location }} replace />
}
