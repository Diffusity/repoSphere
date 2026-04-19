import { ArrowRight, KeyRound, Loader2, Mail, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AuthActionButton,
  AuthAlert,
  AuthDivider,
  AuthField,
  AuthLinkRow,
  AuthShell,
} from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { clearPostLoginRedirect, savePostLoginRedirect } from '@/lib/authRedirect'
import { useAuthStore } from '@/stores/authStore'

function getPasswordHint(password: string) {
  if (!password) return undefined
  if (password.length < 8) return 'Use at least 8 characters before continuing.'
  return 'Length looks good.'
}

export function SignUpPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordHint = useMemo(() => getPasswordHint(password), [password])
  const confirmError =
    confirmPassword && password !== confirmPassword ? 'Passwords need to match before you continue.' : undefined

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await register(name, email, password)
      if (res.success) {
        clearPostLoginRedirect()
        navigate(`/verify-email?email=${encodeURIComponent(res.email)}`, { replace: true })
        return
      }
      setError('Failed to create account')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onGoogle = () => {
    savePostLoginRedirect('/setup-username')
    loginWithGoogle('/setup-username')
  }

  return (
    <AuthShell
      title="Create an account"
      description="Set up your RepoSphere account."
      panelTitle="A sharper first-run experience."
      panelDescription="The new auth flow keeps setup focused: create your account, verify your email, claim a username, and move directly into the workspace that matters."
      footer={<AuthLinkRow prompt="Already have an account?" href="/sign-in" cta="Sign in" />}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField
          label="Full name"
          icon={UserRound}
          placeholder="Robb Stark"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <AuthField
          label="Email address"
          type="email"
          icon={Mail}
          placeholder="rob.stark@got.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <AuthField
          label="Password"
          type="password"
          icon={KeyRound}
          placeholder="Create a password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={passwordHint}
          required
        />
        <AuthField
          label="Confirm password"
          type="password"
          icon={KeyRound}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmError}
          required
        />
        {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}

        <AuthActionButton type="submit" loading={isSubmitting} loadingLabel="Creating your account...">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Create account
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
