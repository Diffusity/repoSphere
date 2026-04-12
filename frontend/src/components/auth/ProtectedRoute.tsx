import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function ProtectedRoute() {
  const { user, isLoaded } = useUser()
  const location = useLocation()

  const { data: me, isLoading: userLoading } = useCurrentUser()
  const hasUsername = user?.publicMetadata?.username || me?.user?.username

  if (!isLoaded || userLoading) return null

  return (
    <>
      <SignedIn>
        {hasUsername ? <Outlet /> : <Navigate to="/setup-username" state={{ from: location }} replace />}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
