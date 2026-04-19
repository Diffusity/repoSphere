const POST_LOGIN_REDIRECT_KEY = 'reposphere:post-login-redirect'

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function normalizeRedirectTarget(target: string | null | undefined, fallback = '/dashboard') {
  if (!target || !target.startsWith('/')) return fallback
  return target
}

export function savePostLoginRedirect(target: string) {
  if (!canUseSessionStorage()) return
  window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, normalizeRedirectTarget(target))
}

export function readPostLoginRedirect() {
  if (!canUseSessionStorage()) return null
  return window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
}

export function takePostLoginRedirect() {
  if (!canUseSessionStorage()) return null
  const value = readPostLoginRedirect()
  if (value) {
    window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
  }
  return value
}

export function clearPostLoginRedirect() {
  if (!canUseSessionStorage()) return
  window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
}

export function describeRedirectTarget(target: string) {
  const normalized = normalizeRedirectTarget(target)
  if (normalized.startsWith('/terminal')) return 'your terminal authorization session'
  if (normalized === '/dashboard') return 'your dashboard'
  if (normalized === '/repositories') return 'your repositories'
  return 'the page you were trying to open'
}
