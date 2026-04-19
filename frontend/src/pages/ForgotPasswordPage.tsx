import { ArrowRight, Loader2, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword } from '@/api/auth'
import { useApiClient } from '@/api/client'
import {
  AuthActionButton,
  AuthAlert,
  AuthField,
  AuthLinkRow,
  AuthShell,
} from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'

export function ForgotPasswordPage() {
  const client = useApiClient()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await forgotPassword(client, email)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a reset code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      badge="Recovery"
      title="Forgot password?"
      description="Enter your account email and we will send a reset code."
      backHref="/sign-in"
      backLabel="Back to sign in"
      panelTitle="Recovery that stays calm and clear."
      panelDescription="Instead of dropping you into a dead-end form, the reset flow explains what is happening, what email to expect, and how to keep moving if you are switching between tabs or devices."
      footer={
        submitted ? (
          <AuthLinkRow prompt="Already have the code?" href={`/reset-password?email=${encodeURIComponent(email)}`} cta="Open reset step" />
        ) : (
          <div className="flex justify-center">
            <Link to="/sign-in" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Remembered your password?
            </Link>
          </div>
        )
      }
    >
      {!submitted ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <AuthField
            label="Account email"
            type="email"
            icon={Mail}
            placeholder="you@company.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint="We will send a six-digit code if that account exists."
            required
          />

          {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}

          <AuthActionButton type="submit" loading={loading} loadingLabel="Sending your reset code...">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            Send reset code
          </AuthActionButton>
        </form>
      ) : (
        <div className="space-y-4">
          <AuthAlert tone="success">
            If an account exists for <span className="font-medium text-white">{email}</span>, a reset code is on its way now.
          </AuthAlert>

          <div className="grid gap-3 sm:grid-cols-2">
            <AuthActionButton type="button" onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}>
              Continue to reset
            </AuthActionButton>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.06]"
              onClick={() => {
                setSubmitted(false)
                setError(null)
              }}
            >
              Use another email
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  )
}
