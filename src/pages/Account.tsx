import { useState, type FormEvent } from 'react'
import { useChangePassword } from '../api/hooks'
import { useMe } from '../auth/AuthContext'
import EmailDelivery from '../components/EmailDelivery'
import { Button, Card, ErrorBanner, Field, Hero, PasswordInput, PasswordRules, SuccessBanner, fieldError } from '../components/ui'

export default function Account() {
  const me = useMe()
  const change = useChangePassword()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const valid = current.length > 0 && next.length >= 8 && next !== current && next === confirm

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    change.mutate({ currentPassword: current, password: next }, { onSuccess: () => { setCurrent(''); setNext(''); setConfirm('') } })
  }

  return (
    <>
      <Hero eyebrow="Account" title={me.user.name} subtitle={<>{me.user.email} · {me.role === 'admin' ? 'Admin' : 'Therapist'}</>} />
      <div className="page-body">
        <Card title="Change password">
          <form onSubmit={submit} noValidate style={{ maxWidth: 460 }}>
            {change.isSuccess && <SuccessBanner>Password changed. Use your new password next time you sign in.</SuccessBanner>}
            <ErrorBanner error={change.error && !fieldError(change.error, 'currentPassword') && !fieldError(change.error, 'password') ? change.error : null} />
            <Field label="Current password" error={fieldError(change.error, 'currentPassword')}>{(id) => <PasswordInput id={id} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Your current password" />}</Field>
            <Field label="New password" error={fieldError(change.error, 'password')}>{(id) => <PasswordInput id={id} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" />}</Field>
            <Field label="Confirm new password">{(id) => <PasswordInput id={id} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again" />}</Field>
            <PasswordRules password={next} current={current} confirm={confirm} />
            <Button type="submit" size="lg" loading={change.isPending} disabled={!valid} style={{ marginTop: 18 }}>Change password</Button>
          </form>
        </Card>
        {me.role === 'admin' && <EmailDelivery defaultTo={me.user.email} />}
      </div>
    </>
  )
}
