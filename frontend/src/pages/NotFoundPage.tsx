import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-rs-bg px-4 py-12 text-center">
      <div className="subtle-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b from-rs-elevated/45 to-transparent" />
      <div className="relative mx-auto flex min-h-[70vh] max-w-3xl items-center">
        <div className="w-full space-y-6">
          <PageHeader
            badge="404"
            title="This page drifted out of orbit"
            description="The route does not exist, or the page moved somewhere else in RepoSphere."
            icon={Compass}
            meta={<span className="page-meta-pill">Try returning to the dashboard or landing page</span>}
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link to="/dashboard">Open dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back to landing page</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
