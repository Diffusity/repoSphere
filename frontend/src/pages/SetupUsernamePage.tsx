import { AtSign, CheckCircle2, Loader2, UserRound, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AuthActionButton,
  AuthAlert,
  AuthLinkRow,
  AuthShell,
  authInputClassName,
} from '@/components/auth/AuthShell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUsernameAvailability, useSetUsername } from '@/hooks/useUsername'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function SetupUsernamePage() {
  const user = useAuthStore((s) => s.user)
  const isLoaded = useAuthStore((s) => s.isLoaded)
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsernameInput] = useState('')
  const [debouncedUsername, setDebouncedUsername] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const from = location.state?.from?.pathname || '/dashboard'
  const search = location.state?.from?.search || ''

  const { data: availability, isLoading: isChecking } = useUsernameAvailability(debouncedUsername)
  const setUsernameMutation = useSetUsername()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username)
    }, 350)
    return () => clearTimeout(timer)
  }, [username])

  useEffect(() => {
    if (isLoaded && user?.username) {
      navigate(from + search, { replace: true })
    }
  }, [isLoaded, user, navigate, from, search])

  const usernameTooShort = username.length > 0 && username.length < 3
  const usernameAvailable = username.length >= 3 && availability?.data?.available
  const usernameTaken = username.length >= 3 && !isChecking && availability?.data?.available === false

  const availabilityMessage = usernameTooShort
    ? 'Use at least 3 characters.'
    : usernameTaken
      ? 'That username is already taken.'
      : usernameAvailable
        ? 'Great choice. That username is available.'
        : 'Use lowercase letters, numbers, or underscores.'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!availability?.data?.available) return

    try {
      await setUsernameMutation.mutateAsync(username)
      navigate(from + search, { replace: true })
    } catch (err) {
      const message: string =
        err instanceof Error
          ? err.message || 'Failed to set username'
          : typeof err === 'object' &&
              err !== null &&
              'response' in err &&
              typeof (err as { response?: { data?: { detail?: string } } }).response?.data?.detail === 'string'
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to set username'
            : 'Failed to set username'
      setSubmitError(message)
    }
  }

  if (!isLoaded) return null

  return (
    <AuthShell
      badge="Final step"
      title="Choose your username"
      description="Pick the handle for your profile and repository URLs."
      backHref="/dashboard"
      backLabel="Back to app"
      panelTitle="Finish account setup with a handle that fits."
      panelDescription="This step keeps momentum high after verification or social sign-in. Check availability live, see the URL shape instantly, and continue to the page you were originally trying to reach."
      footer={<AuthLinkRow prompt="Need to sign in differently?" href="/sign-in" cta="Return to sign in" />}
    >
      <div className="space-y-4">
        <AuthAlert>
          Your profile URL will look like <span className="font-medium text-white">reposphere.app/{username || 'your_name'}</span>.
        </AuthAlert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2.5">
            <Label htmlFor="username" className="text-sm font-medium text-slate-200">
              Username
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <AtSign className="size-4" />
              </span>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }}
                placeholder="ada_builds"
                className={cn(authInputClassName, 'pl-11 pr-12')}
                disabled={setUsernameMutation.isPending}
                autoFocus
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                {isChecking ? (
                  <Loader2 className="size-4 animate-spin text-slate-400" />
                ) : username.length >= 3 ? (
                  usernameAvailable ? (
                    <CheckCircle2 className="size-4 text-emerald-300" />
                  ) : (
                    <XCircle className="size-4 text-rose-300" />
                  )
                ) : (
                  <UserRound className="size-4 text-slate-500" />
                )}
              </div>
            </div>
            <p
              className={cn(
                'text-xs leading-5',
                usernameAvailable ? 'text-emerald-300' : usernameTaken || usernameTooShort ? 'text-rose-300' : 'text-slate-500'
              )}
            >
              {availabilityMessage}
            </p>
          </div>

          {submitError ? <AuthAlert tone="danger">{submitError}</AuthAlert> : null}

          <AuthActionButton
            type="submit"
            loading={setUsernameMutation.isPending}
            loadingLabel="Saving your username..."
            disabled={!availability?.data?.available || username.length < 3}
          >
            Complete setup
          </AuthActionButton>
        </form>
      </div>
    </AuthShell>
  )
}
