import { ArrowRight, KeyRound, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { forgotPassword, resetPassword } from '@/api/auth'
import { useApiClient } from '@/api/client'
import {
  AuthActionButton,
  AuthAlert,
  AuthField,
  AuthLinkRow,
  AuthShell,
} from '@/components/auth/AuthShell'
import { OTPInput } from '@/components/auth/OTPInput'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const client = useApiClient()
  const navigate = useNavigate()
  const refreshUser = useAuthStore((s) => s.refreshUser)

  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await resetPassword(client, email, otp, password)
      if (!res.success) {
        setError(res.message ?? 'Password reset failed')
        return
      }
      await refreshUser()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  const onResend = async () => {
    if (!email) return
    setResending(true)
    setError(null)
    try {
      await forgotPassword(client, email)
      setCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the reset code')
    } finally {
      setResending(false)
    }
  }

  const confirmError =
    confirmPassword && password !== confirmPassword ? 'Passwords need to match before you submit.' : undefined

  return (
    <AuthShell
      badge="Step 2 of 2"
      title="Set a new password"
      description="Enter the reset code and choose a new password."
      backHref="/forgot-password"
      backLabel="Back to recovery"
      panelTitle="Fast recovery with less guesswork."
      panelDescription="The reset step keeps security visible without slowing you down: one code, one password update, and a direct return to your authenticated workspace."
      headerSlot={
        email ? (
          <AuthAlert>
            Reset code for <span className="font-medium text-white">{email}</span>.
          </AuthAlert>
        ) : (
          <AuthAlert tone="danger">Open this step from the password recovery email flow so the reset code can be matched correctly.</AuthAlert>
        )
      }
      footer={<AuthLinkRow prompt="Need a new code?" href="/forgot-password" cta="Restart recovery" />}
    >
      {email ? (
        <div className="space-y-4">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-200">Reset code</label>
                <span className="text-xs uppercase tracking-[0.22em] text-slate-500">6 digits</span>
              </div>
              <OTPInput value={otp} onChange={setOtp} disabled={loading} autoFocus />
            </div>

            <AuthField
              label="New password"
              type="password"
              icon={KeyRound}
              autoComplete="new-password"
              placeholder="Choose a new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Use at least 8 characters."
              required
            />
            <AuthField
              label="Confirm new password"
              type="password"
              icon={KeyRound}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmError}
              required
            />

            {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}

            <AuthActionButton
              type="submit"
              loading={loading}
              loadingLabel="Resetting your password..."
              disabled={otp.length !== 6}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              Reset password
            </AuthActionButton>
          </form>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-md border-rs-border bg-rs-bg/45 text-slate-100 hover:bg-rs-elevated"
            onClick={() => void onResend()}
            disabled={resending || cooldown > 0}
          >
            {resending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {resending ? 'Sending another code...' : cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend reset code'}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <AuthAlert tone="danger">
            We need the recovery email address before we can validate a reset code.
          </AuthAlert>
          <div className="grid gap-3 sm:grid-cols-2">
            <AuthActionButton type="button" onClick={() => navigate('/forgot-password')}>
              Restart recovery
            </AuthActionButton>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-md border-rs-border bg-rs-bg/45 text-slate-100 hover:bg-rs-elevated"
              onClick={() => navigate('/sign-in')}
            >
              Back to sign in
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  )
}
