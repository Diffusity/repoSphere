import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { CommitDetailPage } from '@/pages/CommitDetailPage'
import { CommitListPage } from '@/pages/CommitListPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RepositoryListPage } from '@/pages/RepositoryListPage'
import { RepositoryPage } from '@/pages/RepositoryPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SignInPage } from '@/pages/SignInPage'
import { SignUpPage } from '@/pages/SignUpPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/repositories" element={<RepositoryListPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/:username/:repoName/commits" element={<CommitListPage />} />
          <Route path="/:username/:repoName/commit/:hash" element={<CommitDetailPage />} />
          <Route path="/:username/:repoName" element={<RepositoryPage />} />
          <Route path="/:username" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
