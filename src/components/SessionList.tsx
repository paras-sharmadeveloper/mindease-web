import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookingAction } from '../api/hooks'
import type { Booking } from '../api/types'
import { fmtDate, fmtMoney, fmtTime, relative } from '../lib/format'
import { useNow } from '../lib/useNow'
import { Ban, Check, Video } from './icons'
import { Button, Empty, ErrorBanner, Modal, Pill, StatusBadge } from './ui'

export default function SessionList({ bookings, showTherapist, emptyText }: { bookings: Booking[]; showTherapist: boolean; emptyText: string }) {
  const [cancelling, setCancelling] = useState<Booking | null>(null)
  const action = useBookingAction()
  const navigate = useNavigate()
  const now = useNow(30_000)

  if (bookings.length === 0) return <Empty title="No sessions">{emptyText}</Empty>

  return (
    <>
      <ErrorBanner error={action.error} />
      <div className="sessions">
      {bookings.map((b) => {
        const joinOpen = b.canJoin && b.joinOpensAt && now >= new Date(b.joinOpensAt).getTime() && now < new Date(b.endsAt).getTime()
        const live = b.status === 'confirmed' && now >= new Date(b.startsAt).getTime() && now < new Date(b.endsAt).getTime()
        const start = new Date(b.startsAt)
        return (
          <div className="session" key={b.id}>
            <div className={`when ${live ? 'live' : ''}`}>
              <span>{start.toLocaleDateString('en-AU', { weekday: 'short' })}</span>
              <b>{fmtTime(b.startsAt)}</b>
              <span>{start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
            </div>
            <div className="session-main">
              <div className="name">
                <b>{b.client.name}</b>
                <StatusBadge status={b.status} />
                {live && <Pill tone="yellow">Live now</Pill>}
              </div>
              <div className="sub">
                {fmtTime(b.startsAt)} – {fmtTime(b.endsAt)} · {b.status === 'confirmed' ? relative(b.startsAt) : fmtDate(b.startsAt)}
                {showTherapist && <> · with {b.therapist.name}</>}
              </div>
              <div className="sub">
                {fmtMoney(b.priceCents, b.currency)}
                {b.payment && b.payment.refundedCents > 0 && <> · refunded {fmtMoney(b.payment.refundedCents, b.currency)}</>}
                {' · '}{b.client.email}
              </div>
              {b.focus?.length > 0 && <div className="chips" style={{ marginTop: 8 }}>{b.focus.map((f) => <span className="chip" key={f.key}>{f.label}</span>)}</div>}
              {b.clientMobile && <div className="sub">{b.clientMobile}</div>}
              {b.notes && <div className="note-box"><b>Client note:</b> {b.notes}</div>}
            </div>
            <div className="session-actions">
              {b.canJoin && b.status === 'confirmed' && (
                <Button size="sm" disabled={!joinOpen} title={joinOpen ? '' : `Opens ${b.joinOpensAt ? relative(b.joinOpensAt) : ''}`} onClick={() => navigate(`/call/${b.id}`)}>
                  <Video size={17} />{joinOpen ? 'Join call' : `Opens ${fmtTime(b.joinOpensAt!)}`}
                </Button>
              )}
              {b.canMarkOutcome && b.status !== 'completed' && (
                <Button variant="secondary" size="sm" loading={action.isPending} onClick={() => action.mutate({ id: b.id, action: 'outcome', status: 'completed' })}><Check size={15} />Completed</Button>
              )}
              {b.canMarkOutcome && b.status !== 'no_show' && (
                <Button variant="secondary" size="sm" loading={action.isPending} onClick={() => action.mutate({ id: b.id, action: 'outcome', status: 'no_show' })}><Ban size={15} />No-show</Button>
              )}
              {b.canCancel && <Button variant="danger" size="sm" onClick={() => setCancelling(b)}>Cancel</Button>}
            </div>
          </div>
        )
      })}
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
    </>
  )
}
