import { useState, type FormEvent } from 'react'
import type { TherapistInput } from '../api/hooks'
import type { Therapist } from '../api/types'
import { Button, ErrorBanner, Field, Input, Select, Textarea, fieldError } from './ui'

const AU_ZONES = ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Darwin', 'Australia/Perth', 'Australia/Hobart']

interface Props {
  initial?: Therapist
  mode: 'create' | 'admin-edit' | 'self-edit'
  defaultPriceCents?: number
  onSubmit: (input: TherapistInput) => void
  pending: boolean
  error: unknown
  submitLabel: string
  footer?: React.ReactNode
}

/** Profile fields. Admins also set name, email, price and visibility; new therapists get a temporary password. */
export default function TherapistForm({ initial, mode, onSubmit, pending, error, submitLabel, footer }: Props) {
  const admin = mode !== 'self-edit'
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [password, setPassword] = useState('')
  const [bio, setBio] = useState(initial?.bio ?? '')
  const [specialties, setSpecialties] = useState((initial?.specialties ?? []).join(', '))
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? '')
  const [timezone, setTimezone] = useState(initial?.timezone ?? 'Australia/Sydney')
  const [customPrice, setCustomPrice] = useState(initial?.customPrice ?? false)
  const [price, setPrice] = useState(initial ? (initial.priceCents / 100).toFixed(2) : '150.00')
  const [active, setActive] = useState(initial?.active ?? true)

  const zones = AU_ZONES.includes(timezone) ? AU_ZONES : [...AU_ZONES, timezone]

  function submit(e: FormEvent) {
    e.preventDefault()
    const input: TherapistInput = {
      bio: bio.trim() || null,
      specialties: specialties.split(',').map((s) => s.trim()).filter(Boolean),
      photoUrl: photoUrl.trim() || null,
      timezone,
    }
    if (admin) {
      Object.assign(input, { name: name.trim(), email: email.trim(), active, priceCents: customPrice ? Math.round(parseFloat(price) * 100) : null })
    }
    if (mode === 'create') input.password = password
    onSubmit(input)
  }

  const err = (f: string) => fieldError(error, f)

  return (
    <form onSubmit={submit} noValidate>
      <ErrorBanner error={error && !(['name', 'email', 'password', 'bio', 'photoUrl', 'timezone', 'priceCents'] as const).some((f) => err(f)) ? error : null} />
      <div className="form-grid">
        {admin && <Field label="Full name" error={err('name')}>{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr Jo Park" required />}</Field>}
        {admin && <Field label="Email (used to sign in)" error={err('email')}>{(id) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />}</Field>}
        {mode === 'create' && (
          <div className="span-2">
            <Field label="Temporary password" error={err('password')} hint="At least 8 characters. Share it with the therapist securely; they can change it under Account.">
              {(id) => <Input id={id} type="text" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
            </Field>
          </div>
        )}
        <div className="span-2">
          <Field label="Bio" error={err('bio')} hint="Shown to clients in the app.">{(id) => <Textarea id={id} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Registered psychologist with 10 years' experience in…" />}</Field>
        </div>
        <Field label="Specialties" error={err('specialties')} hint="Separate with commas, e.g. anxiety, stress, grief">{(id) => <Input id={id} value={specialties} onChange={(e) => setSpecialties(e.target.value)} />}</Field>
        <Field label="Timezone" error={err('timezone')} hint="Weekly hours are in this timezone.">
          {(id) => <Select id={id} value={timezone} onChange={(e) => setTimezone(e.target.value)}>{zones.map((z) => <option key={z} value={z}>{z.replace('_', ' ')}</option>)}</Select>}
        </Field>
        <div className="span-2">
          <Field label="Photo URL" error={err('photoUrl')} hint="Optional. Must start with https://">{(id) => <Input id={id} type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://" />}</Field>
        </div>
        {admin && (
          <>
            <Field label="Session price" error={err('priceCents')} hint={customPrice ? 'AUD, GST inclusive.' : 'Uses the default price.'}>
              {(id) => (
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <label className="check"><input type="checkbox" checked={customPrice} onChange={(e) => setCustomPrice(e.target.checked)} /> Custom</label>
                  <Input id={id} type="number" min="1" step="0.01" value={price} disabled={!customPrice} onChange={(e) => setPrice(e.target.value)} />
                </div>
              )}
            </Field>
            <Field label="Visibility">
              {() => <label className="check" style={{ minHeight: 46 }}><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Shown in the app and bookable</label>}
            </Field>
          </>
        )}
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
        {footer}
        <Button type="submit" loading={pending}>{submitLabel}</Button>
      </div>
    </form>
  )
}
