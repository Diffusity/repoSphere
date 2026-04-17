import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'

export function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectParam = new URLSearchParams(location.search).get('redirect')
  const from = (location.state as { from?: { pathname?: string; search?: string } } | undefined)?.from
  const redirectTo = from?.pathname ? `${from.pathname}${from.search ?? ''}` : '/dashboard'
  const targetAfterLogin = redirectParam || redirectTo

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const result = await login(email, password)
      if (result.success) {
        navigate(targetAfterLogin, { replace: true })
        return
      }
      if (result.needsVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(result.email)}`, { replace: true })
        return
      }
      setError('Unable to sign in')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-rs-bg px-4 py-12">
      <Link to="/" className="mb-8 text-lg font-semibold text-rs-link hover:underline">
        ← RepoSphere
      </Link>
      <Card className="w-full max-w-md border-rs-border bg-rs-surface">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access your RepoSphere account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? <p className="text-sm text-rs-danger">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Sign in'}
            </Button>
          </form>
          <Button variant="outline" className="w-full" onClick={loginWithGoogle}>
            Continue with Google
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="text-rs-link hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            New here?{' '}
            <Link to="/sign-up" className="text-rs-link hover:underline">
              Create account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
