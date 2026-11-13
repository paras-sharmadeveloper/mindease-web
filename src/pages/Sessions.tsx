import { useMemo, useState } from 'react'
import { useBookings, useDeleteBookings, useTherapists, type BookingScope } from '../api/hooks'
import type { BookingStatus } from '../api/types'
import { useMe } from '../auth/AuthContext'
import { Search, Trash } from '../components/icons'
import SessionList from '../components/SessionList'
import { Button, Card, ErrorBanner, Hero, Modal, Select, Spinner, Tabs } from '../components/ui'

type StatusFilter = 'any' | Exclude<BookingStatus, 'pending'>

export default function Sessions() {
  const me = useMe()
  const isAdmin = me.role === 'admin'
  const [scope, setScope] = useState<BookingScope>('upcoming')
  const [status, setStatus] = useState<StatusFilter>('any')
  const [query, setQuery] = useState('')
  const [therapistId, setTherapistId] = useState('')
  const [clearing, setClearing] = useState(false)
  const therapists = useTherapists(isAdmin)
  const bookings = useBookings(scope, therapistId || undefined)
  const remove = useDeleteBookings()

  const all = useMemo(() => bookings.data ?? [], [bookings.data])
  const count = (s: StatusFilter) => (s === 'any' ? all.length : all.filter((b) => b.status === s).length)
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((b) =>
      (status === 'any' || b.status === status)
      && (!q || b.client.name.toLowerCase().includes(q) || b.client.email.toLowerCase().includes(q) || (isAdmin && b.therapist.name.toLowerCase().includes(q))))
  }, [all, status, query, isAdmin])
  const deletable = shown.filter((b) => b.canDelete)

  const changeScope = (s: BookingScope) => { setScope(s); setStatus('any') }

  return (
    <>
      <Hero
        eyebrow="Sessions"
        title={isAdmin ? 'All sessions' : 'Your sessions'}
        subtitle={isAdmin ? 'Every booked session across all therapists.' : 'Join a call from 10 minutes before it starts. Mark it completed or no-show afterwards.'}
      />
      <div className="page-body">
        <div className="toolbar">
          <Tabs value={scope} onChange={changeScope} options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past & cancelled' }, { value: 'all', label: 'All' }]} />
          <div className="toolbar-right">
            <label className="search">
              <Search size={18} />
              <span className="sr-only">Search sessions</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isAdmin ? 'Search client or therapist' : 'Search client'} />
            </label>
            {isAdmin && (
              <Select aria-label="Filter by therapist" value={therapistId} onChange={(e) => setTherapistId(e.target.value)} className="input toolbar-select">
                <option value="">All therapists</option>
                {therapists.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            )}
          </div>
        </div>

        <Card>
          {scope !== 'upcoming' && all.length > 0 && (
            <div className="filter-bar">
              <div className="seg" role="tablist" aria-label="Filter by status">
                {(['any', 'completed', 'no_show', 'cancelled'] as StatusFilter[]).map((s) => (
                  <button key={s} role="tab" aria-selected={status === s} className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>
                    {{ any: 'All', completed: 'Completed', no_show: 'No-show', cancelled: 'Cancelled', confirmed: 'Confirmed' }[s]}
                    <span className="count">{count(s)}</span>
                  </button>
                ))}
              </div>
              {deletable.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setClearing(true)}><Trash size={15} />Delete {deletable.length} cancelled</Button>
              )}
            </div>
          )}
          {bookings.isLoading && <Spinner />}
          <ErrorBanner error={bookings.error ?? remove.error} />
          {bookings.data && (
            <SessionList
              bookings={shown}
              showTherapist={isAdmin}
              emptyText={query || status !== 'any' ? 'No sessions match this filter.' : scope === 'upcoming' ? 'No confirmed sessions are coming up.' : 'Nothing here yet.'}
            />
          )}
        </Card>
      </div>

      <Modal
        open={clearing}
        title={`Delete ${deletable.length} cancelled sessions?`}
        onClose={() => setClearing(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setClearing(false)}>Keep them</Button>
          <Button loading={remove.isPending} onClick={() => remove.mutate(deletable.map((b) => b.id), { onSuccess: () => setClearing(false) })}><Trash size={16} />Delete all</Button>
        </>}
      >
        <p>They're removed from your list. The payment and refund records are kept, and clients still see them in their app history.</p>
      </Modal>
    </>
  )
}
