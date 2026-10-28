import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useTherapist, useUpdateTherapist } from '../api/hooks'
import { useAuth, useMe } from '../auth/AuthContext'
import AvailabilityEditor from '../components/AvailabilityEditor'
import TherapistForm from '../components/TherapistForm'
import { Button, Card, ErrorBanner, Field, Input, Modal, PageHeader, Spinner, fieldError } from '../components/ui'
import { fmtMoney } from '../lib/format'

export default function TherapistDetail() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const me = useMe()
  const { reload } = useAuth()
  const isAdmin = me.role === 'admin'
  const therapist = useTherapist(id)
  const update = useUpdateTherapist(id)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  if (therapist.isLoading) return <Spinner />
  if (therapist.error || !therapist.data) return <ErrorBanner error={therapist.error ?? new Error('Not found')} />
  const t = therapist.data

  return (
    <>
      {isAdmin && <Link to="/therapists" className="muted small" style={{ textDecoration: 'none', fontWeight: 700 }}>← All therapists</Link>}
      <PageHeader
        title={t.name}
        subtitle={<>{t.email} · {fmtMoney(t.priceCents, t.currency)} per {t.sessionMinutes}-minute session · <span className={`status status-${t.active ? 'active' : 'inactive'}`}>{t.active ? 'Shown in app' : 'Hidden from app'}</span></>}
        actions={isAdmin && <Button variant="ghost" onClick={() => { update.reset(); setResetOpen(true) }}>Set new password</Button>}
      />
      {params.get('new') && <div className="banner banner-ok">Therapist created. Add their weekly hours below so clients can book them, then share the sign-in details with them.</div>}

      <div className="grid">
        <Card title="Profile">
          {savedAt && <div className="banner banner-ok">Profile saved.</div>}
          <TherapistForm
            key={t.id + (savedAt ?? '')}
            initial={t}
            mode={isAdmin ? 'admin-edit' : 'self-edit'}
            pending={update.isPending && !resetOpen}
            error={resetOpen ? null : update.error}
            submitLabel="Save profile"
            onSubmit={(input) => update.mutate(input, { onSuccess: () => { setSavedAt(Date.now()); if (me.therapist?.id === id) reload() } })}
          />
        </Card>
        <AvailabilityEditor therapistId={t.id} />
      </div>

      <ResetPassword open={resetOpen} name={t.name} onClose={() => setResetOpen(false)} update={update} />
    </>
  )
}

function ResetPassword({ open, name, onClose, update }: { open: boolean; name: string; onClose: () => void; update: ReturnType<typeof useUpdateTherapist> }) {
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const close = () => { setPassword(''); setDone(false); onClose() }
  return (
    <Modal open={open} title="Set a new password" onClose={close}
      footer={done
        ? <Button onClick={close}>Done</Button>
        : <><Button variant="ghost" onClick={close}>Cancel</Button><Button loading={update.isPending} disabled={password.length < 8} onClick={() => update.mutate({ password }, { onSuccess: () => setDone(true) })}>Set password</Button></>}
    >
      {done
        ? <div className="banner banner-ok">Password updated and {name} was signed out everywhere. Share the new password with them securely.</div>
        : <>
          <p className="muted">{name} will be signed out on every device and must use this temporary password next time.</p>
          <ErrorBanner error={update.error && !fieldError(update.error, 'password') ? update.error : null} />
          <Field label="Temporary password" error={fieldError(update.error, 'password')} hint="At least 8 characters.">{(id) => <Input id={id} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />}</Field>
        </>}
    </Modal>
  )
}
