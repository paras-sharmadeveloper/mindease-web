import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AuthLayout from '../components/AuthLayout'
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
    <AuthLayout>
      <form onSubmit={submit} noValidate>
        <h2>Welcome back</h2>
        <p className="muted" style={{ marginBottom: 26 }}>Sign in with the account your MindEase admin created for you.</p>
        <ErrorBanner error={error} />
        <Field label="Email">{(id) => <Input id={id} type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />}</Field>
        <Field label="Password">{(id) => <PasswordInput id={id} autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />}</Field>
        <Button type="submit" size="lg" className="full" loading={busy} disabled={!email || !password} style={{ marginTop: 8 }}>Sign in</Button>
        <p className="muted small" style={{ marginTop: 18, textAlign: 'center' }}><Link to="/forgot-password">Forgot your password?</Link></p>
      </form>
    </AuthLayout>
  )
}
