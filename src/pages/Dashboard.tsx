import { Link } from 'react-router-dom'
import { useBookings, useDashboard } from '../api/hooks'
import { useMe } from '../auth/AuthContext'
import { Calendar, Check, Clock, Cross, Plus, Users } from '../components/icons'
import SessionList from '../components/SessionList'
import { Card, ErrorBanner, Hero, Spinner } from '../components/ui'
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
      <Hero eyebrow={isAdmin ? 'Admin' : 'Therapist'} title={`${greeting}, ${firstName(me.user.name)}`} subtitle={<>Times are shown in your timezone ({localZone.replace('_', ' ')}).</>} />

      <div className="page-body">
        {me.therapist && !me.therapist.active && <div className="banner banner-info">Your profile is hidden from the app. Ask an admin to show it.</div>}
        <ErrorBanner error={stats.error} />
        {stats.data && (
          <div className="stats">
            <Stat icon={<Calendar />} tone="red" value={stats.data.next7Days} label="Sessions in the next 7 days" />
            <Stat icon={<Clock />} tone="yellow" value={stats.data.upcoming} label="Upcoming sessions" />
            <Stat icon={<Check />} tone="green" value={stats.data.completedLast30Days} label="Completed in 30 days" />
            {isAdmin
              ? <Stat icon={<Users />} tone="purple" value={stats.data.activeTherapists ?? 0} label="Therapists in the app" />
              : <Stat icon={<Cross />} tone="purple" value={stats.data.cancelledLast30Days} label="Cancelled in 30 days" />}
          </div>
        )}
        {stats.data && isAdmin && (
          <div className="stats">
            <Stat icon={<Users />} tone="green" value={stats.data.totalUsers ?? 0} label="Total app sign-ups" />
            <Stat icon={<Plus />} tone="red" value={stats.data.newUsersLast24Hours ?? 0} label="New in 24 hours" />
            <Stat icon={<Plus />} tone="yellow" value={stats.data.newUsersLast7Days ?? 0} label="New in 7 days" />
            <Stat icon={<Plus />} tone="purple" value={stats.data.newUsersLast30Days ?? 0} label="New in 30 days" />
          </div>
        )}

        <Card title="Up next" actions={<Link className="btn btn-secondary btn-sm" to="/sessions">See all sessions</Link>}>
          {upcoming.isLoading ? <Spinner /> : <ErrorBanner error={upcoming.error} />}
          {upcoming.data && (
            <SessionList
              bookings={upcoming.data.slice(0, 5)}
              showTherapist={isAdmin}
              emptyText={isAdmin ? 'No confirmed sessions are coming up.' : 'When clients book you in the app, their sessions show up here.'}
            />
          )}
        </Card>
      </div>
    </>
  )
}

function Stat({ icon, tone, value, label }: { icon: React.ReactNode; tone: string; value: number; label: string }) {
  return <div className="stat"><span className={`stat-icon tone-${tone}`}>{icon}</span><b>{value}</b><span>{label}</span></div>
}

/** "Dr Sam Lee" -> "Sam" */
function firstName(name: string): string {
  return name.replace(/^(dr|mr|mrs|ms|mx|prof)\.?\s+/i, '').split(' ')[0] || name
}
