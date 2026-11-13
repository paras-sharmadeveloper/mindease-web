import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookingAction, useDeleteBookings } from '../api/hooks'
import type { Booking } from '../api/types'
import { fmtDate, fmtMoney, fmtTime, relative } from '../lib/format'
import { useNow } from '../lib/useNow'
import { Ban, Check, Clock, Mail, Note, Smartphone, Trash, Video, Wallet } from './icons'
import ConfirmDelete from './ConfirmDelete'
import { Button, Empty, ErrorBanner, Modal, Pill, StatusBadge } from './ui'

/** "Today", "Tomorrow", "Yesterday" or "Mon 17 Nov 2026", in the viewer's timezone. */
function dayLabel(iso: string): string {
  const d = new Date(iso)
  const key = (x: Date) => x.toDateString()
  const today = new Date()
  const shift = (n: number) => { const x = new Date(today); x.setDate(x.getDate() + n); return key(x) }
  if (key(d) === key(today)) return 'Today'
  if (key(d) === shift(1)) return 'Tomorrow'
  if (key(d) === shift(-1)) return 'Yesterday'
  return fmtDate(iso)
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?'

export default function SessionList({ bookings, showTherapist, emptyText, grouped = true }: { bookings: Booking[]; showTherapist: boolean; emptyText: string; grouped?: boolean }) {
  const [cancelling, setCancelling] = useState<Booking | null>(null)
  const [deleting, setDeleting] = useState<Booking | null>(null)
  const action = useBookingAction()
  const remove = useDeleteBookings()
  const navigate = useNavigate()
  const now = useNow(30_000)

  if (bookings.length === 0) return <Empty title="No sessions">{emptyText}</Empty>

  // Group consecutive sessions by day (the list is already sorted by the API).
  const groups: { label: string; items: Booking[] }[] = []
  for (const b of bookings) {
    const label = grouped ? dayLabel(b.startsAt) : ''
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(b)
    else groups.push({ label, items: [b] })
  }

  return (
    <>
      <ErrorBanner error={action.error ?? remove.error} />
      <div className="session-groups">
        {groups.map((g) => (
          <section key={g.label + g.items[0]!.id} className="session-group">
            {grouped && <h3 className="day-head"><span>{g.label}</span><small>{g.items.length} {g.items.length === 1 ? 'session' : 'sessions'}</small></h3>}
            <div className="sessions">
              {g.items.map((b) => {
                const joinOpen = b.canJoin && b.joinOpensAt && now >= new Date(b.joinOpensAt).getTime() && now < new Date(b.endsAt).getTime()
                const live = b.status === 'confirmed' && now >= new Date(b.startsAt).getTime() && now < new Date(b.endsAt).getTime()
                const start = new Date(b.startsAt)
                const refunded = b.payment && b.payment.refundedCents > 0
                return (
                  <article className={`session-card status-${b.status} ${live ? 'is-live' : ''}`} key={b.id}>
                    <div className={`when ${live ? 'live' : ''}`}>
                      <span>{start.toLocaleDateString('en-AU', { weekday: 'short' })}</span>
                      <b>{start.toLocaleDateString('en-AU', { day: 'numeric' })}</b>
                      <span>{start.toLocaleDateString('en-AU', { month: 'short' })}</span>
                    </div>

                    <div className="session-main">
                      <div className="session-top">
                        <span className="avatar sm" aria-hidden>{initials(b.client.name)}</span>
                        <div className="session-title">
                          <b>{b.client.name}</b>
                          <span className="session-time"><Clock size={14} />{fmtTime(b.startsAt)} – {fmtTime(b.endsAt)}
                            {b.status === 'confirmed' && !live && <em> · {relative(b.startsAt)}</em>}
                            {showTherapist && <em> · with {b.therapist.name}</em>}
                          </span>
                        </div>
                        <div className="session-badges">
                          {live && <Pill tone="yellow">Live now</Pill>}
                          <StatusBadge status={b.status} />
                        </div>
                      </div>

                      <div className="meta">
                        <span><Wallet size={15} />{fmtMoney(b.priceCents, b.currency)}{refunded && <> · refunded {fmtMoney(b.payment!.refundedCents, b.currency)}</>}</span>
                        <span><Mail size={15} /><a href={`mailto:${b.client.email}`}>{b.client.email}</a></span>
                        {b.clientMobile && <span><Smartphone size={15} /><a href={`tel:${b.clientMobile}`}>{b.clientMobile}</a></span>}
                      </div>

                      {b.focus?.length > 0 && <div className="chips">{b.focus.map((f) => <span className="chip" key={f.key}>{f.label}</span>)}</div>}
                      {b.notes && <div className="note-box"><Note size={16} /><span><b>Client note</b>{b.notes}</span></div>}
                      {b.status === 'cancelled' && b.cancelReason && <div className="small muted">Cancelled{b.cancelReason === 'therapist' ? ' by you' : b.cancelReason === 'user' ? ' by the client' : ''}.</div>}

                      {(b.canJoin && b.status === 'confirmed') || b.canMarkOutcome || b.canCancel || b.canDelete ? (
                        <div className="session-actions">
                          {b.canJoin && b.status === 'confirmed' && (
                            <Button size="sm" disabled={!joinOpen} title={joinOpen ? '' : `Opens ${b.joinOpensAt ? relative(b.joinOpensAt) : ''}`} onClick={() => navigate(`/call/${b.id}`)}>
                              <Video size={17} />{joinOpen ? 'Join call' : `Join opens ${fmtTime(b.joinOpensAt!)}`}
                            </Button>
                          )}
                          {b.canMarkOutcome && b.status !== 'completed' && (
                            <Button variant="secondary" size="sm" loading={action.isPending} onClick={() => action.mutate({ id: b.id, action: 'outcome', status: 'completed' })}><Check size={15} />Completed</Button>
                          )}
                          {b.canMarkOutcome && b.status !== 'no_show' && (
                            <Button variant="secondary" size="sm" loading={action.isPending} onClick={() => action.mutate({ id: b.id, action: 'outcome', status: 'no_show' })}><Ban size={15} />No-show</Button>
                          )}
                          {b.canCancel && <Button variant="danger" size="sm" onClick={() => setCancelling(b)}>Cancel session</Button>}
                          {b.canDelete && <Button variant="ghost" size="sm" onClick={() => setDeleting(b)}><Trash size={15} />Delete</Button>}
                        </div>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <Modal
        open={!!cancelling}
        title="Cancel this session?"
        onClose={() => setCancelling(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setCancelling(null)}>Keep session</Button>
          <Button loading={action.isPending} onClick={() => cancelling && action.mutate({ id: cancelling.id, action: 'cancel' }, { onSuccess: () => setCancelling(null) })}>Cancel and refund</Button>
        </>}
      >
        {cancelling && (
          <p>
            {cancelling.client.name}'s session on <b>{fmtDate(cancelling.startsAt)} at {fmtTime(cancelling.startsAt)}</b> will be cancelled.
            {cancelling.payment && cancelling.status === 'confirmed'
              ? <> They'll get a <b>full refund of {fmtMoney(cancelling.payment.amountCents - cancelling.payment.refundedCents, cancelling.currency)}</b>.</>
              : null}
            {' '}The client sees the cancellation in the app.
          </p>
        )}
      </Modal>

      <ConfirmDelete
        open={!!deleting}
        title="Delete this session?"
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate([deleting.id], { onSuccess: () => setDeleting(null) })}
      >
        {deleting && (
          <p>
            The cancelled session with <b>{deleting.client.name}</b> on <b>{fmtDate(deleting.startsAt)}</b> will be removed from your list
            for good. The payment and refund record is kept, and the client still sees it in their app history.
          </p>
        )}
      </ConfirmDelete>
    </>
  )
}
