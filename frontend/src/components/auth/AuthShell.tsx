import { ArrowLeft, ArrowUpRight, type LucideIcon } from 'lucide-react'
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
  'h-12 rounded-lg border-[#30363d] bg-transparent px-4 text-sm text-white placeholder:text-slate-500 shadow-none transition focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/20'

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
    <div className="relative min-h-screen min-h-dvh overflow-x-hidden bg-[#0d1117] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_28%),linear-gradient(180deg,_rgba(13,17,23,1),_rgba(13,17,23,1))]" />

      <div className="relative mx-auto flex min-h-screen min-h-dvh w-full max-w-md items-center justify-center px-4 py-4 sm:px-5 sm:py-6">
        <section className="w-full">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center justify-center text-slate-100" aria-label="RepoSphere home">
              <span className="inline-flex size-12 items-center justify-center rounded-full border border-white/10 bg-white text-base font-semibold text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.08)]">
                RS
              </span>
            </Link>
          </div>

          <div className="mt-5 text-center">
            {badge ? (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/15 bg-sky-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-sky-200">
                <span className="size-1.5 rounded-full bg-sky-300" />
                {badge}
              </div>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
            {headerSlot ? <div className="mx-auto mt-4 max-w-md text-left">{headerSlot}</div> : null}
          </div>

          <Card className="mx-auto mt-5 max-w-md border-none bg-transparent shadow-none">
            <CardContent className="p-0">{children}</CardContent>
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
        : 'border-white/10 bg-white/[0.04] text-slate-200'

  return (
    <div className={cn('rounded-2xl border px-4 py-3 text-sm leading-6', toneClassName, className)}>
      {children}
    </div>
  )
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#0d1117] px-3 text-sm text-slate-400">{label}</span>
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
      <Link to={href} className="inline-flex items-center gap-1.5 font-medium text-sky-400 transition hover:text-sky-300">
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
      className={cn(
        'h-11 w-full rounded-lg bg-[#238636] text-white shadow-none transition hover:bg-[#2ea043]',
        className
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? loadingLabel ?? children : children}
    </Button>
  )
}
