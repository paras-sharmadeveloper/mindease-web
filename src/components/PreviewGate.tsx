import { useState, type FormEvent, type ReactNode } from 'react'
import { SALT } from '../lib/previewSalt.js'
import { Calendar, Lock, Users, Video } from './icons'
import { Button, ErrorBanner, Field, PasswordInput } from './ui'

// "Coming soon" gate before launch. Set VITE_PREVIEW_PASSWORD_SHA256 at build time
// (npm run preview-hash -- "password"); leave it unset to switch the gate off.
// This only hides the site from casual visitors: all data is still protected by the API sign-in.
const EXPECTED = (import.meta.env.VITE_PREVIEW_PASSWORD_SHA256 as string | undefined)?.trim().toLowerCase()
const STORAGE_KEY = 'mindease.preview'

function remembered(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === EXPECTED } catch { return false }
}

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function PreviewGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => !EXPECTED || remembered())
  if (unlocked) return <>{children}</>
  return <ComingSoon onUnlock={() => setUnlocked(true)} />
}

function ComingSoon({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const ok = (await sha256(SALT + password)) === EXPECTED
    setBusy(false)
    if (!ok) {
      setError(new Error('That password isn\'t right. Please check it and try again.'))
      return
    }
    try { localStorage.setItem(STORAGE_KEY, EXPECTED!) } catch { /* unlocks for this visit only */ }
    onUnlock()
  }

  return (
    <div className="auth">
      <div className="auth-hero">
        <span className="blob b1" aria-hidden /><span className="blob b2" aria-hidden />
        <div className="auth-brand"><span className="logo">M</span>MindEase</div>
        <div className="auth-copy">
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,.8)', marginBottom: 10 }}>Coming soon</div>
          <h1>Something calm is on its way</h1>
          <p>The MindEase panel for therapists and admins is almost ready. We'll open it here very soon.</p>
        </div>
        <div className="auth-points">
          <span><i><Calendar size={18} /></i>Sessions and weekly hours</span>
          <span><i><Video size={18} /></i>Secure video calls, never recorded</span>
          <span><i><Users size={18} /></i>Therapist management for admins</span>
        </div>
      </div>
      <div className="auth-form">
        <form onSubmit={submit} noValidate>
          <span className="empty-icon" style={{ margin: '0 0 16px', background: 'var(--red-soft)', color: 'var(--red-deep)' }}><Lock size={24} /></span>
          <h2>Early access</h2>
          <p className="muted" style={{ marginBottom: 26 }}>This site isn't public yet. Enter the preview password you were given to continue.</p>
          <ErrorBanner error={error} />
          <Field label="Preview password">
            {(id) => <PasswordInput id={id} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Preview password" autoComplete="off" autoFocus />}
          </Field>
          <Button type="submit" size="lg" className="full" loading={busy} disabled={!password} style={{ marginTop: 8 }}>Continue</Button>
          <p className="muted small" style={{ marginTop: 18, textAlign: 'center' }}>Don't have the password? Contact the MindEase team.</p>
        </form>
      </div>
    </div>
  )
}
