import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import AuthLayout from '../components/AuthLayout'
import { Button, ErrorBanner, Field, Input, SuccessBanner, fieldError } from '../components/ui'

/**
 * Sends a reset link (POST /auth/password-reset). The email opens the API's reset page, which sets the
 * new password and links back here. The API answers the same whether or not the email has an account.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const address = email.trim()
      await api('POST', '/auth/password-reset', { email: address }, { auth: false })
      setSentTo(address)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={submit} noValidate>
        <h2>Reset your password</h2>
        {sentTo ? (
          <>
            <SuccessBanner>Check your inbox</SuccessBanner>
            <p className="muted" style={{ margin: '14px 0 26px' }}>
              If <b>{sentTo}</b> has a MindEase account, we've sent it a link to choose a new password.
              The link works once and expires in 60 minutes. Can't find it? Check your spam folder.
            </p>
            <Button type="button" variant="ghost" className="full" onClick={() => setSentTo(null)}>Use a different email</Button>
          </>
        ) : (
          <>
            <p className="muted" style={{ marginBottom: 26 }}>Enter the email you sign in with and we'll send you a link to choose a new password.</p>
            <ErrorBanner error={fieldError(error, 'email') ? null : error} />
            <Field label="Email" error={fieldError(error, 'email')}>
              {(id) => <Input id={id} type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />}
            </Field>
            <Button type="submit" size="lg" className="full" loading={busy} disabled={!email.trim()} style={{ marginTop: 8 }}>Send reset link</Button>
          </>
        )}
        <p className="muted small" style={{ marginTop: 18, textAlign: 'center' }}><Link to="/">Back to sign in</Link></p>
      </form>
    </AuthLayout>
  )
}
