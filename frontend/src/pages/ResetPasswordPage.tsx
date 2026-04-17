import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { forgotPassword, resetPassword } from '@/api/auth'
import { useApiClient } from '@/api/client'
import { OTPInput } from '@/components/auth/OTPInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

  const onSubmit = async (e: React.FormEvent) => {
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
    try {
      await forgotPassword(client, email)
      setCooldown(60)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-rs-bg px-4 py-12">
      <Card className="w-full max-w-md border-rs-border bg-rs-surface">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter your reset code and a new password for {email || 'your account'}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={onSubmit}>
            <OTPInput value={otp} onChange={setOtp} disabled={loading} />
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {error ? <p className="text-sm text-rs-danger">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset password'}
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
