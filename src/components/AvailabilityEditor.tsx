import { useEffect, useState, type FormEvent } from 'react'
import { useAvailability, useBlockPeriod, useSaveWindows, useUnblockPeriod } from '../api/hooks'
import type { AvailabilityWindow } from '../api/types'
import { WEEKDAYS, fmtDateTime, fromLocalInput, toLocalInput } from '../lib/format'
import { Cross, Plus } from './icons'
import { Button, Card, Empty, ErrorBanner, Field, Input, Spinner, SuccessBanner } from './ui'

const ORDER = [1, 2, 3, 4, 5, 6, 0] // Monday first

/** Weekly hours (therapist's timezone) + blocked periods (leave, holidays). */
export default function AvailabilityEditor({ therapistId }: { therapistId: string }) {
  const availability = useAvailability(therapistId)
  const save = useSaveWindows(therapistId)
  const block = useBlockPeriod(therapistId)
  const unblock = useUnblockPeriod(therapistId)
  const [windows, setWindows] = useState<AvailabilityWindow[]>([])
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (availability.data && !dirty) setWindows(availability.data.windows)
  }, [availability.data, dirty])

  const update = (next: AvailabilityWindow[]) => { setWindows(next); setDirty(true); setSaved(false) }
  const byDay = (d: number) => windows.map((w, i) => ({ w, i })).filter((x) => x.w.weekday === d)

  function addWindow(day: number) {
    const last = byDay(day).at(-1)?.w
    update([...windows, last ? { weekday: day, start: last.end, end: last.end < '17:00' ? '17:00' : '20:00' } : { weekday: day, start: '09:00', end: '17:00' }])
  }

  function copyToWeekdays(day: number) {
    const src = byDay(day).map((x) => x.w)
    update([...windows.filter((w) => w.weekday === 0 || w.weekday === 6 || w.weekday === day), ...[1, 2, 3, 4, 5].filter((d) => d !== day).flatMap((d) => src.map((w) => ({ ...w, weekday: d })))])
  }

  if (availability.isLoading) return <Card title="Weekly hours"><Spinner /></Card>
  if (availability.error) return <Card title="Weekly hours"><ErrorBanner error={availability.error} /></Card>
  const tz = availability.data!.timezone

  return (
    <>
      <Card
        title="Weekly hours"
        actions={<>
          {dirty && <Button variant="secondary" size="sm" onClick={() => { setDirty(false); setWindows(availability.data!.windows) }}>Discard</Button>}
          <Button size="sm" disabled={!dirty} loading={save.isPending} onClick={() => save.mutate(windows, { onSuccess: () => { setDirty(false); setSaved(true) } })}>Save hours</Button>
        </>}
      >
        <p className="muted small">Times are in <b>{tz}</b>. Clients can book {'50-minute'} sessions inside these hours. Existing bookings are not affected by changes.</p>
        {saved && <SuccessBanner>Hours saved. The app now offers the new slots.</SuccessBanner>}
        <ErrorBanner error={save.error} />
        {ORDER.map((day) => {
          const rows = byDay(day)
          return (
            <div className="day-row" key={day}>
              <div className="day">{WEEKDAYS[day]}</div>
              <div className="windows">
                {rows.length === 0 && <span className="muted" style={{ paddingTop: 12 }}>Not available</span>}
                {rows.map(({ w, i }) => (
                  <div className="window" key={i}>
                    <Input type="time" step={900} value={w.start} aria-label={`${WEEKDAYS[day]} start`} onChange={(e) => update(windows.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
                    <span className="muted">to</span>
                    <Input type="time" step={900} value={w.end} aria-label={`${WEEKDAYS[day]} end`} onChange={(e) => update(windows.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} />
                    <button className="round-btn" aria-label="Remove" onClick={() => update(windows.filter((_, j) => j !== i))}><Cross size={14} /></button>
                  </div>
                ))}
                <div className="row" style={{ gap: 6 }}>
                  <Button variant="secondary" size="sm" onClick={() => addWindow(day)}><Plus size={15} />Add hours</Button>
                  {rows.length > 0 && day >= 1 && day <= 5 && <button className="link-btn" onClick={() => copyToWeekdays(day)}>Copy to Mon–Fri</button>}
                </div>
              </div>
            </div>
          )
        })}
      </Card>
      <BlockedPeriods therapistId={therapistId} block={block} unblock={unblock} exceptions={availability.data!.exceptions} />
    </>
  )
}

function BlockedPeriods({ exceptions, block, unblock }: {
  therapistId: string
  exceptions: { id: number; startsAt: string; endsAt: string; reason: string | null }[]
  block: ReturnType<typeof useBlockPeriod>
  unblock: ReturnType<typeof useUnblockPeriod>
}) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0, 0, 0, 0)
  const dayAfter = new Date(tomorrow); dayAfter.setDate(dayAfter.getDate() + 1)
  const [from, setFrom] = useState(toLocalInput(tomorrow))
  const [to, setTo] = useState(toLocalInput(dayAfter))
  const [reason, setReason] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    block.mutate({ startsAt: fromLocalInput(from), endsAt: fromLocalInput(to), reason: reason.trim() || undefined }, { onSuccess: () => setReason('') })
  }

  return (
    <Card title="Time off">
      <p className="muted small">Block leave or holidays. No new bookings can be made inside these periods. Times are in your local timezone.</p>
      <ErrorBanner error={block.error ?? unblock.error} />
      <form onSubmit={submit} className="form-grid">
        <Field label="From">{(id) => <Input id={id} type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />}</Field>
        <Field label="Until">{(id) => <Input id={id} type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
        <div className="span-2 row" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}><Field label="Reason (optional)">{(id) => <Input id={id} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Annual leave" />}</Field></div>
          <div style={{ marginBottom: 16 }}><Button type="submit" variant="dark" loading={block.isPending}>Block time</Button></div>
        </div>
      </form>
      {exceptions.length === 0
        ? <Empty title="No time off scheduled" />
        : (
          <div className="table-wrap"><table>
            <thead><tr><th>From</th><th>Until</th><th>Reason</th><th /></tr></thead>
            <tbody>{exceptions.map((x) => (
              <tr key={x.id}>
                <td>{fmtDateTime(x.startsAt)}</td><td>{fmtDateTime(x.endsAt)}</td><td className="muted">{x.reason ?? '—'}</td>
                <td style={{ textAlign: 'right' }}><Button variant="secondary" size="sm" loading={unblock.isPending && unblock.variables === x.id} onClick={() => unblock.mutate(x.id)}>Remove</Button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
    </Card>
  )
}
