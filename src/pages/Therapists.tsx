import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateTherapist, useFocusAreas, useTherapists } from '../api/hooks'
import { Plus } from '../components/icons'
import TherapistForm from '../components/TherapistForm'
import { ActivePill, Button, Card, Empty, ErrorBanner, Hero, Input, Modal, Spinner } from '../components/ui'
import { specialtyKeys } from '../api/types'
import { fmtMoney } from '../lib/format'

export default function Therapists() {
  const therapists = useTherapists()
  const create = useCreateTherapist()
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const focusAreas = useFocusAreas()
  const labels = Object.fromEntries((focusAreas.data ?? []).map((a) => [a.key, a.label]))
  const list = (therapists.data ?? []).filter((t) => `${t.name} ${t.email} ${specialtyKeys(t.specialties).map((s) => labels[s] ?? s).join(' ')}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <Hero
        eyebrow="Admin"
        title="Therapists"
        subtitle="Add therapists, set their prices and choose who appears in the app."
        actions={<Button size="lg" className="btn-light" onClick={() => { create.reset(); setAdding(true) }}><Plus size={18} />Add therapist</Button>}
      />
      <div className="page-body">
        <Card
          title={`${therapists.data?.length ?? 0} therapists`}
          actions={<div style={{ width: 260 }}><Input style={{ height: 46 }} placeholder="Search by name or specialty" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search therapists" /></div>}
        >
          {therapists.isLoading && <Spinner />}
          <ErrorBanner error={therapists.error} />
          {therapists.data && list.length === 0 && <Empty title="No therapists found">{query ? 'Try another search.' : 'Add your first therapist to start taking bookings.'}</Empty>}
          {list.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Therapist</th><th>Specialties</th><th>Timezone</th><th>Price</th><th>Status</th></tr></thead>
                <tbody>
                  {list.map((t) => (
                    <tr key={t.id} className="clickable" onClick={() => navigate(`/therapists/${t.id}`)}>
                      <td><div className="person"><span className="avatar">{t.name.replace(/^dr\.?\s+/i, '').slice(0, 1)}</span><div><b>{t.name}</b><span className="sub">{t.email}</span></div></div></td>
                      <td><div className="chips">{t.specialties.length ? specialtyKeys(t.specialties).map((s) => <span className="chip" key={s}>{labels[s] ?? s}</span>) : <span className="muted">—</span>}</div></td>
                      <td className="muted">{t.timezone.replace('Australia/', '')}</td>
                      <td><b>{fmtMoney(t.priceCents, t.currency)}</b>{!t.customPrice && <span className="sub">default</span>}</td>
                      <td><ActivePill active={t.active} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal open={adding} title="Add a therapist" onClose={() => setAdding(false)}>
        {adding && (
          <TherapistForm
            mode="create"
            pending={create.isPending}
            error={create.error}
            submitLabel="Create therapist"
            footer={<Button type="button" variant="secondary" size="lg" onClick={() => setAdding(false)}>Cancel</Button>}
            onSubmit={(input) => create.mutate(input, { onSuccess: (t) => { setAdding(false); navigate(`/therapists/${t.id}?new=1`) } })}
          />
        )}
      </Modal>
    </>
  )
}
