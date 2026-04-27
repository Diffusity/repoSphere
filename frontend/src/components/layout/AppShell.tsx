import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function AppShell() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-transparent">
      <div className="subtle-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b from-rs-elevated/45 to-transparent" />
      <div className="pointer-events-none absolute right-[8%] top-[-4rem] h-72 w-72 rounded-full bg-rs-link/10 blur-[120px]" />

      <Sidebar />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col pt-14 md:pt-0">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
