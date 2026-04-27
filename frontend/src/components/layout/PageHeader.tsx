import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  badge?: string
  title: string
  description: string
  icon?: LucideIcon
  visual?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  badge,
  title,
  description,
  icon: Icon,
  visual,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section className={cn('page-hero', className)}>
      <div className="page-hero-glow" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-4">
          {badge ? <div className="page-kicker">{badge}</div> : null}
          <div className="flex items-start gap-4">
            {visual ?? (Icon ? <PageHeaderIcon icon={Icon} /> : null)}
            <div className="min-w-0 space-y-2">
              <h1 className="page-title text-balance">{title}</h1>
              <p className="page-subtitle max-w-3xl">{description}</p>
              {meta ? <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div> : null}
            </div>
          </div>
        </div>

        {actions ? <div className="relative flex shrink-0 flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
      </div>
    </section>
  )
}

function PageHeaderIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-rs-border bg-rs-surface/90 text-rs-link shadow-lg shadow-black/20">
      <Icon className="size-5" />
    </span>
  )
}
