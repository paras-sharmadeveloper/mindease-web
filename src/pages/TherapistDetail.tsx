import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTherapist, useUpdateTherapist } from '../api/hooks'
import { useAuth, useMe } from '../auth/AuthContext'
import AvailabilityEditor from '../components/AvailabilityEditor'
import { Lock } from '../components/icons'
import TherapistForm from '../components/TherapistForm'
import { ActivePill, Button, Card, ErrorBanner, Field, Hero, Modal, PasswordInput, PasswordRules, Spinner, SuccessBanner, fieldError } from '../components/ui'
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
      <Hero
        back={isAdmin ? '/therapists' : undefined}
        eyebrow={isAdmin ? 'Therapist' : 'Your profile'}
        title={t.name}
        subtitle={<><span>{t.email}</span><span>·</span><span>{fmtMoney(t.priceCents, t.currency)} per {t.sessionMinutes}-minute session</span><ActivePill active={t.active} /></>}
        actions={isAdmin && <Button variant="secondary" onClick={() => { update.reset(); setResetOpen(true) }}><Lock size={17} />Set new password</Button>}
      />
      <div className="page-body">
        {params.get('new') && <SuccessBanner>Therapist created. Add their weekly hours below so clients can book them, then share the sign-in details with them.</SuccessBanner>}

        <Card title="Profile">
          {savedAt && <SuccessBanner>Profile saved.</SuccessBanner>}
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
        ? <Button size="lg" onClick={close}>Done</Button>
        : <><Button variant="secondary" size="lg" onClick={close}>Cancel</Button><Button size="lg" loading={update.isPending} disabled={password.length < 8} onClick={() => update.mutate({ password }, { onSuccess: () => setDone(true) })}>Set password</Button></>}
    >
      {done
        ? <SuccessBanner>Password updated and {name} was signed out everywhere. Share the new password with them securely.</SuccessBanner>
        : <>
          <p className="muted">{name} will be signed out on every device and must use this temporary password next time.</p>
          <ErrorBanner error={update.error && !fieldError(update.error, 'password') ? update.error : null} />
          <Field label="Temporary password" error={fieldError(update.error, 'password')}>
            {(id) => <><PasswordInput id={id} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" /><PasswordRules password={password} /></>}
          </Field>
        </>}
    </Modal>
  )
}
