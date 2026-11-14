import { Link, useNavigate } from 'react-router-dom'
import { useBookings, useDashboard } from '../api/hooks'
import { useMe } from '../auth/AuthContext'
import { Calendar, Check, Clock, Cross, Plus, Users, Video } from '../components/icons'
import SessionList from '../components/SessionList'
import type { Booking } from '../api/types'
import { Button, Card, ErrorBanner, Hero, Spinner } from '../components/ui'
import { useNow } from '../lib/useNow'
import { fmtDate, fmtTime, localZone, relative } from '../lib/format'

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
        {stats.data && isAdmin && (<>
          <div className="stats">
            <Stat icon={<Users />} tone="green" value={stats.data.totalUsers ?? 0} label="Total app sign-ups" />
            <Stat icon={<Plus />} tone="red" value={stats.data.newUsersLast24Hours ?? 0} label="New in 24 hours" />
            <Stat icon={<Plus />} tone="yellow" value={stats.data.newUsersLast7Days ?? 0} label="New in 7 days" />
            <Stat icon={<Plus />} tone="purple" value={stats.data.newUsersLast30Days ?? 0} label="New in 30 days" />
          </div>
          <div className="stats-link"><Link className="btn btn-secondary btn-sm" to="/users">See all sign-ups</Link></div>
        </>)}

        {!isAdmin && upcoming.data?.[0] && <NextSession booking={upcoming.data[0]} />}

        {(isAdmin || !upcoming.data?.[0] || upcoming.data.length > 1) && (
        <Card title={isAdmin ? 'Up next' : upcoming.data?.[0] ? 'Later' : 'Up next'} actions={<Link className="btn btn-secondary btn-sm" to="/sessions">See all sessions</Link>}>
          {upcoming.isLoading ? <Spinner /> : <ErrorBanner error={upcoming.error} />}
          {upcoming.data && (
            <SessionList
              bookings={isAdmin ? upcoming.data.slice(0, 5) : upcoming.data.slice(1, 6)}
              showTherapist={isAdmin}
              emptyText={isAdmin ? 'No confirmed sessions are coming up.' : 'When clients book you in the app, their sessions show up here.'}
            />
          )}
        </Card>
        )}
      </div>
    </>
  )
}

/** Therapist home: the very next session, big, with the Join button. */
function NextSession({ booking: b }: { booking: Booking }) {
  const navigate = useNavigate()
  const now = useNow(30_000)
  const joinOpen = b.canJoin && b.joinOpensAt && now >= new Date(b.joinOpensAt).getTime() && now < new Date(b.endsAt).getTime()
  const live = now >= new Date(b.startsAt).getTime() && now < new Date(b.endsAt).getTime()
  return (
    <section className={`next-session ${live ? 'live' : ''}`}>
      <div className="next-info">
        <span className="eyebrow">{live ? 'Happening now' : 'Your next session'}</span>
        <h2>{b.client.name}</h2>
        <p>{fmtDate(b.startsAt)} · {fmtTime(b.startsAt)} – {fmtTime(b.endsAt)}{!live && <> · <b>{relative(b.startsAt)}</b></>}</p>
        {b.focus?.length > 0 && <div className="chips">{b.focus.map((f) => <span className="chip" key={f.key}>{f.label}</span>)}</div>}
      </div>
      {b.canJoin && (
        <Button size="lg" className="btn-light" disabled={!joinOpen} onClick={() => navigate(`/call/${b.id}`)}>
          <Video size={20} />{joinOpen ? 'Join call' : `Join opens ${fmtTime(b.joinOpensAt!)}`}
        </Button>
      )}
    </section>
  )
}

function Stat({ icon, tone, value, label }: { icon: React.ReactNode; tone: string; value: number; label: string }) {
  return <div className="stat"><span className={`stat-icon tone-${tone}`}>{icon}</span><b>{value}</b><span>{label}</span></div>
}

/** "Dr Sam Lee" -> "Sam" */
function firstName(name: string): string {
  return name.replace(/^(dr|mr|mrs|ms|mx|prof)\.?\s+/i, '').split(' ')[0] || name
}
