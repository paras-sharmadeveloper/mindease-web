import { useEffect, useState } from 'react'
import { useAppUsers } from '../api/hooks'
import type { SignupPeriod } from '../api/types'
import { Check, ChevronLeft, Plus, Search, Users as UsersIcon } from '../components/icons'
import { Button, Card, Empty, ErrorBanner, Hero, Pill, Spinner } from '../components/ui'
import { fmtDate, fmtTime, relative } from '../lib/format'

const PERIODS: { value: SignupPeriod; label: string; count: 'all' | 'last24Hours' | 'last7Days' | 'last30Days' }[] = [
  { value: 'all', label: 'All', count: 'all' },
  { value: '24h', label: '24 hours', count: 'last24Hours' },
  { value: '7d', label: '7 days', count: 'last7Days' },
  { value: '30d', label: '30 days', count: 'last30Days' },
]

export default function Users() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<SignupPeriod>('all')
  const [page, setPage] = useState(1)

  // Search after typing stops, and go back to page 1 when the filter changes.
  useEffect(() => {
    const t = setTimeout(() => { setQuery(input.trim()); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [input])

  const users = useAppUsers(query, period, page)
  const d = users.data

  return (
    <>
      <Hero eyebrow="Admin" title="App sign-ups" subtitle="Everyone who has created an account in the MindEase app, newest first." />
      <div className="page-body">
        {d && (
          <div className="stats">
            <Stat icon={<UsersIcon />} tone="green" value={d.counts.all} label="Total app sign-ups" />
            <Stat icon={<Plus />} tone="red" value={d.counts.last24Hours} label="New in 24 hours" />
            <Stat icon={<Plus />} tone="yellow" value={d.counts.last7Days} label="New in 7 days" />
            <Stat icon={<Plus />} tone="purple" value={d.counts.last30Days} label="New in 30 days" />
          </div>
        )}

        <Card>
          <div className="filter-bar">
            <div className="seg" role="tablist" aria-label="Signed up in">
              {PERIODS.map((p) => (
                <button key={p.value} role="tab" aria-selected={period === p.value} className={period === p.value ? 'on' : ''} onClick={() => { setPeriod(p.value); setPage(1) }}>
                  {p.label}{d && <span className="count">{d.counts[p.count]}</span>}
                </button>
              ))}
            </div>
            <label className="search">
              <Search size={18} />
              <span className="sr-only">Search sign-ups</span>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search name, email or mobile" />
            </label>
          </div>

          {users.isLoading && <Spinner />}
          <ErrorBanner error={users.error} />
          {d && d.data.length === 0 && <Empty title="No sign-ups">{query || period !== 'all' ? 'No one matches this filter.' : 'When people create an account in the app, they show up here.'}</Empty>}
          {d && d.data.length > 0 && (
            <>
              <div className="table-wrap" style={{ opacity: users.isPlaceholderData ? 0.6 : 1 }}>
                <table>
                  <thead><tr><th>User</th><th>Signed up</th><th>Last active</th><th>Questionnaire</th><th>Sessions</th><th>Progress</th></tr></thead>
                  <tbody>
                    {d.data.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="person">
                            {u.photoUrl ? <img className="avatar" src={u.photoUrl} alt="" /> : <span className="avatar">{u.name.slice(0, 1).toUpperCase() || '?'}</span>}
                            <div>
                              <b>{u.name}</b>
                              <span className="sub"><a href={`mailto:${u.email}`}>{u.email}</a>{!u.emailVerified && ' · not verified'}</span>
                              {u.mobile && <span className="sub"><a href={`tel:${u.mobile}`}>{u.mobile}</a></span>}
                            </div>
                          </div>
                        </td>
                        <td className="nowrap"><b>{fmtDate(u.signedUpAt)}</b><span className="sub">{fmtTime(u.signedUpAt)} · {relative(u.signedUpAt)}</span></td>
                        <td className="muted">{u.lastActiveAt ? relative(u.lastActiveAt) : '—'}</td>
                        <td>{u.questionnaireCompleted ? <Pill tone="green" icon={<Check size={13} />}>Done</Pill> : <Pill tone="stone">Not yet</Pill>}</td>
                        <td><b>{u.bookings}</b><span className="sub">{u.sessionsCompleted} completed</span></td>
                        <td><b>{u.points} pts</b><span className="sub">{u.phasesCompleted} {u.phasesCompleted === 1 ? 'phase' : 'phases'} done</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pager">
                <span className="muted small">
                  {(d.page - 1) * d.perPage + 1}–{(d.page - 1) * d.perPage + d.data.length} of {d.total}
                </span>
                <div className="pager-buttons">
                  <Button variant="secondary" size="sm" disabled={d.page <= 1} onClick={() => setPage(d.page - 1)}><ChevronLeft size={15} />Previous</Button>
                  <Button variant="secondary" size="sm" disabled={d.page >= d.lastPage} onClick={() => setPage(d.page + 1)}>Next<ChevronLeft size={15} style={{ transform: 'rotate(180deg)' }} /></Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  )
}

function Stat({ icon, tone, value, label }: { icon: React.ReactNode; tone: string; value: number; label: string }) {
  return <div className="stat"><span className={`stat-icon tone-${tone}`}>{icon}</span><b>{value}</b><span>{label}</span></div>
}
