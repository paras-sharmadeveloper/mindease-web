import { useState } from 'react'
import { useBookings, useTherapists, type BookingScope } from '../api/hooks'
import { useMe } from '../auth/AuthContext'
import SessionList from '../components/SessionList'
import { Card, ErrorBanner, PageHeader, Select, Spinner, Tabs } from '../components/ui'

export default function Sessions() {
  const me = useMe()
  const isAdmin = me.role === 'admin'
  const [scope, setScope] = useState<BookingScope>('upcoming')
  const [therapistId, setTherapistId] = useState('')
  const therapists = useTherapists(isAdmin)
  const bookings = useBookings(scope, therapistId || undefined)

  return (
    <>
      <PageHeader
        title="Sessions"
        subtitle={isAdmin ? 'Every booked session across all therapists.' : 'Your booked sessions. You can join a call 10 minutes before it starts.'}
        actions={isAdmin && (
          <Select aria-label="Filter by therapist" value={therapistId} onChange={(e) => setTherapistId(e.target.value)} style={{ minWidth: 220 }}>
            <option value="">All therapists</option>
            {therapists.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        )}
      />
      <Tabs value={scope} onChange={setScope} options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past & cancelled' }, { value: 'all', label: 'All' }]} />
      <Card>
        {bookings.isLoading && <Spinner />}
        <ErrorBanner error={bookings.error} />
        {bookings.data && (
          <SessionList
            bookings={bookings.data}
            showTherapist={isAdmin}
            emptyText={scope === 'upcoming' ? 'No confirmed sessions are coming up.' : 'Nothing here yet.'}
          />
        )}
      </Card>
    </>
  )
}
