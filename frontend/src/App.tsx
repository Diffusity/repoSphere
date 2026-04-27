import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { CommitDetailPage } from '@/pages/CommitDetailPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { RepositoryListPage } from '@/pages/RepositoryListPage'
import { RepositoryPage } from '@/pages/RepositoryPage'
import { RepoSettingsPage } from '@/pages/RepoSettingsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SignInPage } from '@/pages/SignInPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { TerminalAuthPage } from '@/pages/TerminalAuthPage'
import { CLIDemoPage } from '@/pages/CLIDemoPage'
import { SetupUsernamePage } from '@/pages/SetupUsernamePage'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'
import { takePostLoginRedirect } from '@/lib/authRedirect'
import { useAuthStore } from '@/stores/authStore'

export default function App() {
  const initAuth = useAuthStore((s) => s.init)
  const isLoaded = useAuthStore((s) => s.isLoaded)
  const isSignedIn = useAuthStore((s) => s.isSignedIn)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    void initAuth()
  }, [initAuth])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (!['/dashboard', '/setup-username'].includes(location.pathname)) return

    const storedRedirect = takePostLoginRedirect()
    if (storedRedirect && storedRedirect !== location.pathname + location.search) {
      navigate(storedRedirect, { replace: true })
    }
  }, [isLoaded, isSignedIn, location.pathname, location.search, navigate])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/setup-username" element={<SetupUsernamePage />} />
      <Route path="/terminal" element={<TerminalAuthPage />} />
      <Route path="/cli-demo" element={<CLIDemoPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/repositories" element={<RepositoryListPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/:username/:repoName/commits" element={<RepositoryPage />} />
          <Route path="/:username/:repoName/commits/:branch" element={<RepositoryPage />} />
          <Route path="/:username/:repoName/commit/:hash" element={<CommitDetailPage />} />
          <Route path="/:username/:repoName/settings" element={<RepoSettingsPage />} />
          <Route path="/:username/:repoName/blob/:branch/*" element={<RepositoryPage />} />
          <Route path="/:username/:repoName/tree/:branch/*" element={<RepositoryPage />} />
          <Route path="/:username/:repoName/issues" element={<RepositoryPage />} />
          <Route path="/:username/:repoName/issues/*" element={<RepositoryPage />} />
          <Route path="/:username/:repoName" element={<RepositoryPage />} />
          <Route path="/:username" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
