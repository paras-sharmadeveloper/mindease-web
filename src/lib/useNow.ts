import { useEffect, useState } from 'react'

/** Current time, re-rendered every `intervalMs` (for join windows and "in 5 minutes" labels). */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}
