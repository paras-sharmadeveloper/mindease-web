import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Button, ErrorBanner, Field, Input } from '../components/ui'

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
    <div className="auth-page">
      <div className="auth-hero">
        <div className="brand" style={{ padding: 0, position: 'relative' }}><span className="logo" style={{ background: '#fff', color: 'var(--red)' }}>M</span><b style={{ color: '#fff', fontSize: 18 }}>MindEase</b></div>
        <div>
          <h1>Therapist &amp; admin panel</h1>
          <p>Manage your sessions, set your hours and meet clients by video, right in the browser.</p>
        </div>
      </div>
      <div className="auth-form">
        <form onSubmit={submit} noValidate>
          <h2>Sign in</h2>
          <p className="muted" style={{ marginBottom: 22 }}>Use the account your MindEase admin created for you.</p>
          <ErrorBanner error={error} />
          <Field label="Email">{(id) => <Input id={id} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />}</Field>
          <Field label="Password">{(id) => <Input id={id} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}</Field>
          <Button type="submit" className="full" loading={busy} disabled={!email || !password}>Sign in</Button>
          <p className="muted small" style={{ marginTop: 16 }}>Forgot your password? Ask your MindEase admin to set a new temporary password.</p>
        </form>
      </div>
    </div>
  )
}
