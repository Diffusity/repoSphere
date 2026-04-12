import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useUsernameAvailability, useSetUsername } from '@/hooks/useUsername'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle2, XCircle, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'

export function SetupUsernamePage() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsernameInput] = useState('')
  const [debouncedUsername, setDebouncedUsername] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'
  const search = location.state?.from?.search || ''

  const { data: availability, isLoading: isChecking } = useUsernameAvailability(debouncedUsername)
  const setUsernameMutation = useSetUsername()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username)
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  useEffect(() => {
    // If user already has a username, redirect to dashboard or original page
    if (isLoaded && user?.publicMetadata?.username) {
      navigate(from + search, { replace: true })
    }
  }, [isLoaded, user, navigate, from, search])

  const handleSumbit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!availability?.data?.available) return

    try {
      await setUsernameMutation.mutateAsync(username)
      toast.success('Username set successfully!')
      navigate(from + search, { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to set username')
    }
  }

  if (!isLoaded) return null

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
        
        <div className="relative z-10">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
            <UserIcon className="w-8 h-8 text-blue-400" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Choose your username</h1>
          <p className="text-gray-400 mb-8">
            This will be your unique identifier on RepoSphere. You can change it later in settings.
          </p>

          <form onSubmit={handleSumbit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Username</label>
              <div className="relative">
                <Input
                  value={username}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="johndoe"
                  className="bg-black/50 border-white/10 text-white h-12 pl-4 pr-12 focus:ring-blue-500/20"
                  disabled={setUsernameMutation.isPending}
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isChecking ? (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : username.length >= 3 ? (
                    availability?.data?.available ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )
                  ) : null}
                </div>
              </div>
              <div className="text-xs ml-1 min-h-[1.25rem]">
                {username.length > 0 && username.length < 3 && (
                  <span className="text-red-400">At least 3 characters</span>
                )}
                {username.length >= 3 && !isChecking && !availability?.data?.available && (
                  <span className="text-red-400">Username is already taken</span>
                )}
                {username.length >= 3 && !isChecking && availability?.data?.available && (
                  <span className="text-green-400">Username is available</span>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={!availability?.data?.available || setUsernameMutation.isPending || username.length < 3}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-xl font-semibold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50"
            >
              {setUsernameMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              Complete Setup
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
