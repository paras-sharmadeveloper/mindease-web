import { useState, type FormEvent } from 'react'
import { useChangePassword } from '../api/hooks'
import { useMe } from '../auth/AuthContext'
import { Button, Card, ErrorBanner, Field, Input, PageHeader, fieldError } from '../components/ui'

export default function Account() {
  const me = useMe()
  const change = useChangePassword()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = confirm.length > 0 && next !== confirm

  function submit(e: FormEvent) {
    e.preventDefault()
    if (mismatch) return
    change.mutate({ currentPassword: current, password: next }, { onSuccess: () => { setCurrent(''); setNext(''); setConfirm('') } })
  }

  return (
    <>
      <PageHeader title="Account" subtitle={`${me.user.name} · ${me.user.email} · ${me.role === 'admin' ? 'Admin' : 'Therapist'}`} />
      <Card title="Change password" className="narrow">
        <form onSubmit={submit} noValidate style={{ maxWidth: 420 }}>
          {change.isSuccess && <div className="banner banner-ok">Password changed.</div>}
          <ErrorBanner error={change.error && !fieldError(change.error, 'currentPassword') && !fieldError(change.error, 'password') ? change.error : null} />
          <Field label="Current password" error={fieldError(change.error, 'currentPassword')}>{(id) => <Input id={id} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />}</Field>
          <Field label="New password" error={fieldError(change.error, 'password')} hint="At least 8 characters.">{(id) => <Input id={id} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}</Field>
          <Field label="Confirm new password" error={mismatch ? 'The passwords don\'t match.' : null}>{(id) => <Input id={id} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}</Field>
          <Button type="submit" loading={change.isPending} disabled={!current || next.length < 8 || mismatch || !confirm}>Change password</Button>
        </form>
      </Card>
    </>
  )
}
