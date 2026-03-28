import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { Outlet } from 'react-router-dom'

export function ProtectedRoute() {
  return (
    <>
      <SignedIn>
        <Outlet />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
