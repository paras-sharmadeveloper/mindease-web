import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Calendar, Users, Video } from '../components/icons'
import { Button, ErrorBanner, Field, Input, PasswordInput } from '../components/ui'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-hero">
        <span className="blob b1" aria-hidden /><span className="blob b2" aria-hidden />
        <div className="auth-brand"><span className="logo">M</span>MindEase</div>
        <div className="auth-copy">
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,.8)', marginBottom: 10 }}>Therapist &amp; admin panel</div>
          <h1>Care for your clients, all in one place</h1>
          <p>See your sessions, set your hours and meet clients by video, right in the browser.</p>
        </div>
        <div className="auth-points">
          <span><i><Calendar size={18} /></i>Sessions and weekly hours</span>
          <span><i><Video size={18} /></i>Secure video calls, never recorded</span>
          <span><i><Users size={18} /></i>Therapist management for admins</span>
        </div>
      </div>
      <div className="auth-form">
        <form onSubmit={submit} noValidate>
          <h2>Welcome back</h2>
          <p className="muted" style={{ marginBottom: 26 }}>Sign in with the account your MindEase admin created for you.</p>
          <ErrorBanner error={error} />
          <Field label="Email">{(id) => <Input id={id} type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />}</Field>
          <Field label="Password">{(id) => <PasswordInput id={id} autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />}</Field>
          <Button type="submit" size="lg" className="full" loading={busy} disabled={!email || !password} style={{ marginTop: 8 }}>Sign in</Button>
          <p className="muted small" style={{ marginTop: 18, textAlign: 'center' }}>Forgot your password? Ask your MindEase admin to set a new one.</p>
        </form>
      </div>
    </div>
  )
}
