import { ArrowRight, KeyRound, Loader2, Mail, UserRound } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
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

  const onSubmit = async (e: FormEvent) => {
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
      panelDescription="Create your account, verify your email, claim a username, and move into the workspace."
      footer={<AuthLinkRow prompt="Already have an account?" href="/sign-in" cta="Sign in" />}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField
          label="Full name"
          icon={UserRound}
          placeholder="Ada Lovelace"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <AuthField
          label="Email address"
          type="email"
          icon={Mail}
          placeholder="ada@example.com"
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
