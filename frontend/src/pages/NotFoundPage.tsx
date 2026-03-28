import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-4 text-muted-foreground">This page could not be found.</p>
      <Button className="mt-8" asChild variant="outline">
        <Link to="/dashboard">Go home</Link>
      </Button>
    </div>
  )
}
