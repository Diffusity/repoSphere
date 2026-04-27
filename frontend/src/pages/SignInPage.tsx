import { isAxiosError } from 'axios'
import { ArrowRight, Loader2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  AuthActionButton,
  AuthAlert,
  AuthDivider,
  AuthField,
  AuthLinkRow,
  AuthShell,
  authInputClassName,
} from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  clearPostLoginRedirect,
  describeRedirectTarget,
  normalizeRedirectTarget,
  savePostLoginRedirect,
} from '@/lib/authRedirect'
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
  const targetAfterLogin = normalizeRedirectTarget(redirectParam || redirectTo)
  const redirectDescription = describeRedirectTarget(targetAfterLogin)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        clearPostLoginRedirect()
        navigate(targetAfterLogin, { replace: true })
        return
      }
      if (result.needsVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(result.email)}`, { replace: true })
        return
      }
      setError('Unable to sign in right now.')
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status
        if (status && status >= 400 && status < 500) {
          setError('Incorrect email or password')
        } else if (status && status >= 500) {
          setError('Server error')
        } else {
          setError('Failed to sign in')
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to sign in')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const onGoogle = () => {
    savePostLoginRedirect(targetAfterLogin)
    loginWithGoogle(targetAfterLogin)
  }

  return (
    <AuthShell
      title="Sign in"
      description="Continue to RepoSphere."
      panelTitle="Ship faster across browser and terminal."
      panelDescription="RepoSphere auth is designed for developers who jump between command line and repository views."
      headerSlot={
        targetAfterLogin !== '/dashboard' ? (
          <AuthAlert>
            Sign in to continue to <span className="font-medium text-white">{redirectDescription}</span>.
          </AuthAlert>
        ) : null
      }
      footer={
        <div className="space-y-4">
          <AuthLinkRow prompt="Want to create an account?" href="/sign-up" cta="Sign up" />
          <div className="flex justify-center">
            <Link to="/sign-in" className="text-sm font-medium text-rs-link transition hover:text-sky-300">
              Sign in with a passkey
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField
          label="Username or email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-100">
              Password
            </Label>
            <Link to="/forgot-password" className="text-sm font-medium text-rs-link transition hover:text-sky-300">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClassName}
            required
          />
        </div>

        {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}

        <AuthActionButton type="submit" loading={isSubmitting} loadingLabel="Signing you in...">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Sign in
        </AuthActionButton>
      </form>

      <AuthDivider label="or" />

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-md border-rs-border bg-rs-bg/45 text-slate-100 hover:bg-rs-elevated"
        onClick={onGoogle}
      >
        <span className="inline-flex size-5 items-center justify-center rounded-sm bg-white font-semibold text-slate-950">
          G
        </span>
        Continue with Google
      </Button>
    </AuthShell>
  )
}
