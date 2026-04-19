import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resendVerificationOtp, verifyEmailOtp } from '@/api/auth'
import { useApiClient } from '@/api/client'
import { AuthActionButton, AuthAlert, AuthLinkRow, AuthShell } from '@/components/auth/AuthShell'
import { OTPInput } from '@/components/auth/OTPInput'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const client = useApiClient()
  const refreshUser = useAuthStore((s) => s.refreshUser)

  const email = params.get('email') ?? ''
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const submitVerification = async () => {
    if (!email) {
      setError('Missing email context for verification.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const res = await verifyEmailOtp(client, email, otp)
      if (!res.success) {
        setError(res.message ?? 'Verification failed')
        return
      }
      await refreshUser()
      navigate('/setup-username', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitVerification()
  }

  const onResend = async () => {
    if (!email) return
    setResending(true)
    setError(null)
    try {
      await resendVerificationOtp(client, email)
      setCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      badge="Step 2 of 3"
      title="Verify your email"
      description="Enter the 6-digit code from your inbox to continue."
      backHref="/sign-up"
      backLabel="Back to sign up"
      panelTitle="A guided verification step, not a dead end."
      panelDescription="Verification should feel fast and legible. The flow keeps the destination clear, the resend state visible, and the next step obvious once the code lands."
      headerSlot={
        email ? (
          <AuthAlert>
            We sent a code to <span className="font-medium text-white">{email}</span>.
          </AuthAlert>
        ) : (
          <AuthAlert tone="danger">
            We could not determine which email to verify. Start from sign up or sign in again.
          </AuthAlert>
        )
      }
      footer={<AuthLinkRow prompt="Already verified?" href="/sign-in" cta="Return to sign in" />}
    >
      {email ? (
        <div className="space-y-4">
          <form className="space-y-4" onSubmit={onVerify}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-200">Verification code</label>
                <span className="text-xs uppercase tracking-[0.22em] text-slate-500">6 digits</span>
              </div>
              <OTPInput
                value={otp}
                onChange={setOtp}
                onComplete={() => {
                  if (!loading) {
                    void submitVerification()
                  }
                }}
                disabled={loading}
                autoFocus
              />
            </div>

            {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}

            <AuthActionButton type="submit" loading={loading} loadingLabel="Verifying your account..." disabled={otp.length !== 6}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Verify email
            </AuthActionButton>
          </form>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-2xl border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.06]"
            onClick={() => void onResend()}
            disabled={resending || cooldown > 0}
          >
            {resending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {resending ? 'Sending another code...' : cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend code'}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <AuthAlert tone="danger">Start from sign up or sign in again so we know where to send your verification step.</AuthAlert>
          <div className="grid gap-3 sm:grid-cols-2">
            <AuthActionButton type="button" onClick={() => navigate('/sign-up')}>
              Create account
            </AuthActionButton>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.06]"
              onClick={() => navigate('/sign-in')}
            >
              Sign in instead
            </Button>
          </div>
          <div className="flex justify-center">
            <Link to="/sign-in" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Back to sign in
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  )
}
