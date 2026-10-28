import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, api, get, refreshSession, tokens } from '../api/client'
import type { Me, User } from '../api/types'

interface AuthState {
  me: Me | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  reload: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const qc = useQueryClient()

  const clear = useCallback(() => {
    tokens.clear()
    setMe(null)
    qc.clear()
  }, [qc])

  useEffect(() => tokens.onSignedOut(clear), [clear])

  // Restore the session after a reload (refresh token in sessionStorage).
  useEffect(() => {
    (async () => {
      if (await refreshSession()) {
        try { setMe(await get<Me>('/panel/me')) } catch { clear() }
      }
      setLoading(false)
    })()
  }, [clear])

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api<{ user: User; accessToken: string; refreshToken: string }>('POST', '/auth/login', { email, password }, { auth: false })
    tokens.set(res.accessToken, res.refreshToken)
    try {
      setMe(await get<Me>('/panel/me'))
    } catch (e) {
      // App users have no panel access: revoke the tokens we just got.
      await api('POST', '/auth/logout', { refreshToken: res.refreshToken }, { auth: false }).catch(() => {})
      tokens.clear()
      if (e instanceof ApiError && e.code === 'forbidden') {
        throw new ApiError(403, 'forbidden', 'This account doesn\'t have access to the MindEase panel.')
      }
      throw e
    }
  }, [])

  const signOut = useCallback(async () => {
    const refreshToken = tokens.refresh()
    if (refreshToken) await api('POST', '/auth/logout', { refreshToken }, { auth: false }).catch(() => {})
    clear()
  }, [clear])

  const reload = useCallback(async () => { setMe(await get<Me>('/panel/me')) }, [])

  const value = useMemo(() => ({ me, loading, signIn, signOut, reload }), [me, loading, signIn, signOut, reload])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/** Signed-in panel user; only call inside protected routes. */
export function useMe(): Me {
  const { me } = useAuth()
  if (!me) throw new Error('Not signed in')
  return me
}
