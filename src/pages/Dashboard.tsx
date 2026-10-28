import { Link } from 'react-router-dom'
import { useBookings, useDashboard } from '../api/hooks'
import { useMe } from '../auth/AuthContext'
import SessionList from '../components/SessionList'
import { Card, ErrorBanner, PageHeader, Spinner } from '../components/ui'
import { localZone } from '../lib/format'

export default function Dashboard() {
  const me = useMe()
  const stats = useDashboard()
  const upcoming = useBookings('upcoming')
  const isAdmin = me.role === 'admin'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <PageHeader title={`${greeting}, ${firstName(me.user.name)}`} subtitle={`Times are shown in your timezone (${localZone}).`} />

      {me.therapist && !me.therapist.active && <div className="banner banner-info">Your profile is hidden from the app. Ask an admin to activate it.</div>}

      <ErrorBanner error={stats.error} />
      {stats.data && (
        <div className="stats">
          <div className="stat accent"><b>{stats.data.next7Days}</b><span>Sessions in the next 7 days</span></div>
          <div className="stat"><b>{stats.data.upcoming}</b><span>Upcoming sessions</span></div>
          <div className="stat"><b>{stats.data.completedLast30Days}</b><span>Completed (30 days)</span></div>
          {isAdmin
            ? <div className="stat"><b>{stats.data.activeTherapists}</b><span>Active therapists</span></div>
            : <div className="stat"><b>{stats.data.cancelledLast30Days}</b><span>Cancelled (30 days)</span></div>}
        </div>
      )}

      <Card title="Next sessions" actions={<Link className="btn btn-ghost sm" to="/sessions">View all</Link>}>
        {upcoming.isLoading ? <Spinner /> : <ErrorBanner error={upcoming.error} />}
        {upcoming.data && (
          <SessionList
            bookings={upcoming.data.slice(0, 5)}
            showTherapist={isAdmin}
            emptyText={isAdmin ? 'No confirmed sessions are coming up.' : 'When clients book you in the app, their sessions appear here.'}
          />
        )}
      </Card>
    </>
  )
}

/** "Dr Sam Lee" -> "Sam" */
function firstName(name: string): string {
  return name.replace(/^(dr|mr|mrs|ms|mx|prof)\.?\s+/i, '').split(' ')[0] || name
}
