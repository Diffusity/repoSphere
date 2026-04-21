import { isAxiosError } from 'axios'
import { ArrowRight, Loader2 } from 'lucide-react'
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

  const onSubmit = async (e: React.FormEvent) => {
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
      title="Add an account"
      description="Sign in to continue to RepoSphere."
      panelTitle="Ship faster across browser and terminal."
      panelDescription="RepoSphere auth is designed for developers who jump between a command line, a verification step, and a repository view without wanting to repeat themselves."
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
            <Link to="/sign-in" className="text-sm font-medium text-sky-400 transition hover:text-sky-300">
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
            <Link to="/forgot-password" className="text-sm font-medium text-sky-400 transition hover:text-sky-300">
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
        className="h-11 w-full rounded-lg border-[#30363d] bg-[#212830] text-slate-100 hover:bg-[#262e37]"
        onClick={onGoogle}
      >
        <svg width="16" height="16" data-view-component="true">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" data-view-component="true" className="octicon color-fg-default">
            <g clip-path="url(#clip0_643_9687)">
              <path d="M8.00018 3.16667C9.18018 3.16667 10.2368 3.57333 11.0702 4.36667L13.3535 2.08333C11.9668 0.793333 10.1568 0 8.00018 0C4.87352 0 2.17018 1.79333 0.853516 4.40667L3.51352 6.47C4.14352 4.57333 5.91352 3.16667 8.00018 3.16667Z" fill="#EA4335"></path>
              <path d="M15.66 8.18335C15.66 7.66002 15.61 7.15335 15.5333 6.66669H8V9.67335H12.3133C12.12 10.66 11.56 11.5 10.72 12.0667L13.2967 14.0667C14.8 12.6734 15.66 10.6134 15.66 8.18335Z" fill="#4285F4"></path>
              <path d="M3.51 9.53001C3.35 9.04668 3.25667 8.53334 3.25667 8.00001C3.25667 7.46668 3.34667 6.95334 3.51 6.47001L0.85 4.40668C0.306667 5.48668 0 6.70668 0 8.00001C0 9.29334 0.306667 10.5133 0.853333 11.5933L3.51 9.53001Z" fill="#FBBC05"></path>
              <path d="M8.0001 16C10.1601 16 11.9768 15.29 13.2968 14.0633L10.7201 12.0633C10.0034 12.5467 9.0801 12.83 8.0001 12.83C5.91343 12.83 4.14343 11.4233 3.5101 9.52667L0.850098 11.59C2.1701 14.2067 4.87343 16 8.0001 16Z" fill="#34A853"></path>
            </g>
            <defs>
              <clipPath id="clip0_643_9687">
                <rect width="16" height="16" fill="white"></rect>
              </clipPath>
            </defs>
          </svg>
        </svg>
        Continue with Google
      </Button>
    </AuthShell>
  )
}
