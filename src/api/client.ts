// Thin fetch wrapper for the MindEase API.
// Access token: memory only. Refresh token: sessionStorage (cleared when the tab closes).
// Refresh tokens rotate on every use and reuse revokes the session, so refreshes are single-flight.

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/v1'
const REFRESH_KEY = 'mindease.refresh'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly field: string | null
  readonly fields: Record<string, string[]>

  constructor(status: number, code: string, message: string, field: string | null = null, fields: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.field = field
    this.fields = fields
  }
}

let accessToken: string | null = null
let refreshing: Promise<boolean> | null = null
let onSignedOut: () => void = () => {}

export const tokens = {
  set(access: string, refresh: string) {
    accessToken = access
    try { sessionStorage.setItem(REFRESH_KEY, refresh) } catch { /* storage blocked: session lasts until reload */ }
  },
  refresh(): string | null {
    try { return sessionStorage.getItem(REFRESH_KEY) } catch { return null }
  },
  clear() {
    accessToken = null
    try { sessionStorage.removeItem(REFRESH_KEY) } catch { /* ignore */ }
  },
  onSignedOut(fn: () => void) { onSignedOut = fn },
}

async function parse(res: Response): Promise<unknown> {
  if (res.status === 204 || res.status === 202) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

function toError(res: Response, body: unknown): ApiError {
  const err = (body as { error?: { code: string; message: string; field: string | null; fields?: Record<string, string[]> } } | null)?.error
  if (err) return new ApiError(res.status, err.code, err.message, err.field, err.fields ?? {})
  return new ApiError(res.status, 'http_error', 'Something went wrong. Please try again.')
}

async function raw(method: string, path: string, body?: unknown, auth = true): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`
  try {
    return await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, 'network', 'Can\'t reach the server. Check your connection and try again.')
  }
}

/** Exchanges the stored refresh token for a new pair. Concurrent callers share one request. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = tokens.refresh()
    if (!refreshToken) return false
    try {
      const res = await raw('POST', '/auth/refresh', { refreshToken }, false)
      if (!res.ok) return false
      const data = (await parse(res)) as { accessToken: string; refreshToken: string }
      tokens.set(data.accessToken, data.refreshToken)
      return true
    } catch {
      return false
    }
  })().finally(() => { refreshing = null })
  return refreshing
}

export async function api<T>(method: string, path: string, body?: unknown, opts: { auth?: boolean } = {}): Promise<T> {
  const auth = opts.auth ?? true
  let res = await raw(method, path, body, auth)

  if (res.status === 401 && auth) {
    if (await refreshSession()) {
      res = await raw(method, path, body, auth)
    } else {
      tokens.clear()
      onSignedOut()
    }
  }

  const data = await parse(res)
  if (!res.ok) throw toError(res, data)
  return data as T
}

export const get = <T>(path: string) => api<T>('GET', path)
export const post = <T>(path: string, body?: unknown) => api<T>('POST', path, body)
export const put = <T>(path: string, body?: unknown) => api<T>('PUT', path, body)
export const patch = <T>(path: string, body?: unknown) => api<T>('PATCH', path, body)
export const del = <T>(path: string) => api<T>('DELETE', path)
