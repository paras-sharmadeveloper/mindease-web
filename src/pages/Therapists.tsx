import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateTherapist, useTherapists } from '../api/hooks'
import TherapistForm from '../components/TherapistForm'
import { Button, Card, Empty, ErrorBanner, Modal, PageHeader, Spinner } from '../components/ui'
import { fmtMoney } from '../lib/format'

export default function Therapists() {
  const therapists = useTherapists()
  const create = useCreateTherapist()
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const list = (therapists.data ?? []).filter((t) => `${t.name} ${t.email} ${t.specialties.join(' ')}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <PageHeader
        title="Therapists"
        subtitle="Add therapists, set their prices and choose who appears in the app."
        actions={<Button onClick={() => { create.reset(); setAdding(true) }}>+ Add therapist</Button>}
      />
      <Card title={`${therapists.data?.length ?? 0} therapists`} actions={<input className="input" style={{ minHeight: 38, width: 240 }} placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search therapists" />}>
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
                    <td><b>{t.name}</b><span className="sub">{t.email}</span></td>
                    <td><div className="chips">{t.specialties.length ? t.specialties.map((s) => <span className="chip" key={s}>{s}</span>) : <span className="muted">—</span>}</div></td>
                    <td className="muted">{t.timezone.replace('Australia/', '')}</td>
                    <td>{fmtMoney(t.priceCents, t.currency)}{!t.customPrice && <span className="sub">default</span>}</td>
                    <td><span className={`status status-${t.active ? 'active' : 'inactive'}`}>{t.active ? 'Active' : 'Hidden'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={adding} title="Add a therapist" onClose={() => setAdding(false)}>
        {adding && (
          <TherapistForm
            mode="create"
            pending={create.isPending}
            error={create.error}
            submitLabel="Create therapist"
            footer={<Button type="button" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>}
            onSubmit={(input) => create.mutate(input, { onSuccess: (t) => { setAdding(false); navigate(`/therapists/${t.id}?new=1`) } })}
          />
        )}
      </Modal>
    </>
  )
}
