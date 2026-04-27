import { ArrowLeft, ArrowUpRight, GitBranch, type LucideIcon } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface AuthShellProps {
  badge?: string
  title: string
  description: string
  backHref?: string
  backLabel?: string
  showBackLink?: boolean
  panelTitle: string
  panelDescription: string
  panelFooter?: React.ReactNode
  headerSlot?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}

export const authInputClassName =
  'h-11 rounded-md border-rs-border bg-rs-bg/45 px-4 text-sm text-white placeholder:text-slate-500 shadow-sm shadow-black/10 transition focus-visible:border-rs-link focus-visible:ring-2 focus-visible:ring-rs-link/25'

export function AuthShell({
  badge,
  title,
  description,
  backHref = '/',
  backLabel = 'Back to RepoSphere',
  showBackLink = false,
  panelTitle,
  panelDescription,
  panelFooter,
  headerSlot,
  footer,
  children,
}: AuthShellProps) {
  void panelTitle
  void panelDescription
  void panelFooter

  return (
    <div className="relative min-h-screen min-h-dvh overflow-hidden bg-rs-bg text-white">
      <div className="subtle-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b from-rs-elevated/50 to-transparent" />

      <div className="relative mx-auto flex min-h-screen min-h-dvh w-full max-w-md items-center justify-center px-4 py-8 sm:px-5">
        <section className="w-full">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center justify-center text-slate-100" aria-label="RepoSphere home">
              <span className="inline-flex size-12 items-center justify-center rounded-lg border border-rs-border bg-rs-surface text-rs-accent shadow-lg shadow-black/30">
                <GitBranch className="size-5" />
              </span>
            </Link>
          </div>

          <div className="mt-5 text-center">
            {badge ? (
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-rs-link/20 bg-rs-link/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rs-link">
                <span className="size-1.5 rounded-full bg-rs-link" />
                {badge}
              </div>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
            {headerSlot ? <div className="mx-auto mt-4 max-w-md text-left">{headerSlot}</div> : null}
          </div>

          <Card className="mx-auto mt-5 max-w-md border-rs-border/80 bg-rs-surface/88 shadow-xl shadow-black/30 backdrop-blur">
            <CardContent className="p-4 sm:p-5">{children}</CardContent>
          </Card>

          {footer ? <div className="mx-auto mt-5 max-w-md">{footer}</div> : null}

          {showBackLink ? (
            <div className="mt-5 flex justify-center">
              <Link
                to={backHref}
                className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
              >
                <ArrowLeft className="size-4" />
                {backLabel}
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}

interface AuthAlertProps {
  tone?: 'default' | 'success' | 'danger'
  children: React.ReactNode
  className?: string
}

export function AuthAlert({ tone = 'default', children, className }: AuthAlertProps) {
  const toneClassName =
    tone === 'danger'
      ? 'border-rose-400/20 bg-rose-400/10 text-rose-100'
      : tone === 'success'
        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
        : 'border-rs-border/80 bg-rs-bg/45 text-slate-200'

  return (
    <div className={cn('rounded-lg border px-4 py-3 text-sm leading-6', toneClassName, className)}>
      {children}
    </div>
  )
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-rs-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-rs-surface px-3 text-sm text-slate-400">{label}</span>
      </div>
    </div>
  )
}

interface AuthFieldProps extends Omit<React.ComponentProps<typeof Input>, 'size'> {
  label: string
  hint?: string
  error?: string
  icon?: LucideIcon
}

export function AuthField({ label, hint, error, className, icon: Icon, id, ...props }: AuthFieldProps) {
  const fallbackId = React.useId()
  const inputId = id ?? fallbackId
  const hintId = hint || error ? `${inputId}-hint` : undefined

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={inputId} className="text-sm font-semibold text-slate-100">
          {label}
        </Label>
      </div>
      <div className="relative">
        {Icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
            <Icon className="size-4" />
          </span>
        ) : null}
        <Input
          id={inputId}
          aria-describedby={hintId}
          className={cn(authInputClassName, Icon ? 'pl-11' : '', className)}
          {...props}
        />
      </div>
      {hint || error ? (
        <p id={hintId} className={cn('text-xs leading-5', error ? 'text-rose-300' : 'text-slate-500')}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  )
}

interface AuthLinkRowProps {
  prompt: string
  href: string
  cta: string
}

export function AuthLinkRow({ prompt, href, cta }: AuthLinkRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-400">
      <span>{prompt}</span>
      <Link to={href} className="inline-flex items-center gap-1.5 font-medium text-rs-link transition hover:text-sky-300">
        {cta}
        <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  )
}

interface AuthActionButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean
  loadingLabel?: string
}

export function AuthActionButton({
  children,
  className,
  loading = false,
  loadingLabel,
  ...props
}: AuthActionButtonProps) {
  return (
    <Button
      className={cn('h-11 w-full rounded-md bg-primary text-primary-foreground shadow-sm', className)}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? loadingLabel ?? children : children}
    </Button>
  )
}
