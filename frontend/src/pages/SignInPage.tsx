import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-rs-bg px-4 py-12">
      <Link to="/" className="mb-8 text-lg font-semibold text-rs-link hover:underline">
        ← RepoSphere
      </Link>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  )
}
