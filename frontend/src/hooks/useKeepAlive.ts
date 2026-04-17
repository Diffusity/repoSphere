import { useEffect, useRef } from 'react'

const HEALTH_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:6020'}/api/v1/health`
const PING_INTERVAL_MS = 5_000 // 5 seconds

/**
 * Keeps the Render free-tier backend alive by pinging
 * the health endpoint at a fixed interval.
 * Runs silently in the background — errors are swallowed.
 */
export function useKeepAlive() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const ping = () => {
      fetch(HEALTH_URL, { method: 'GET', mode: 'no-cors' }).catch(() => {})
    }

    // Fire immediately on mount, then every PING_INTERVAL_MS
    ping()
    timerRef.current = setInterval(ping, PING_INTERVAL_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])
}
