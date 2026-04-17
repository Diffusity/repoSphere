import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resendVerificationOtp, verifyEmailOtp } from '@/api/auth'
import { useApiClient } from '@/api/client'
import { OTPInput } from '@/components/auth/OTPInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    setResending(true)
    try {
      await resendVerificationOtp(client, email)
      setCooldown(60)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-rs-bg px-4 py-12">
      <Card className="w-full max-w-md border-rs-border bg-rs-surface">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>Enter the 6-digit code sent to {email || 'your email'}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={onVerify}>
            <OTPInput
              value={otp}
              onChange={setOtp}
              onComplete={() => {
                if (!loading) {
                  void submitVerification()
                }
              }}
              disabled={loading}
            />
            {error ? <p className="text-sm text-rs-danger">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void onResend()}
            disabled={resending || cooldown > 0 || !email}
          >
            {resending ? 'Resending...' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/sign-in" className="text-rs-link hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
