import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookingAction } from '../api/hooks'
import type { Booking } from '../api/types'
import { fmtDate, fmtMoney, fmtTime, relative } from '../lib/format'
import { useNow } from '../lib/useNow'
import { Button, Empty, ErrorBanner, Modal, StatusBadge } from './ui'

export default function SessionList({ bookings, showTherapist, emptyText }: { bookings: Booking[]; showTherapist: boolean; emptyText: string }) {
  const [cancelling, setCancelling] = useState<Booking | null>(null)
  const action = useBookingAction()
  const navigate = useNavigate()
  const now = useNow(30_000)

  if (bookings.length === 0) return <Empty title="No sessions">{emptyText}</Empty>

  return (
    <>
      <ErrorBanner error={action.error} />
      {bookings.map((b) => {
        const joinOpen = b.canJoin && b.joinOpensAt && now >= new Date(b.joinOpensAt).getTime() && now < new Date(b.endsAt).getTime()
        const live = now >= new Date(b.startsAt).getTime() && now < new Date(b.endsAt).getTime()
        return (
          <div className="session" key={b.id}>
            <div className="when">
              <span>{fmtDate(b.startsAt).split(',')[0]}</span>
              <b>{fmtTime(b.startsAt)}</b>
              <span>{new Date(b.startsAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
            </div>
            <div className="session-main">
              <div className="row" style={{ gap: 8 }}>
                <b>{b.client.name}</b>
                <StatusBadge status={b.status} />
                {live && b.status === 'confirmed' && <span className="status status-pending">Live now</span>}
              </div>
              <div className="sub">
                {fmtTime(b.startsAt)} – {fmtTime(b.endsAt)} · {b.status === 'confirmed' ? relative(b.startsAt) : fmtDate(b.startsAt)}
                {showTherapist && <> · with {b.therapist.name}</>}
                {' · '}{fmtMoney(b.priceCents, b.currency)}
                {b.payment && b.payment.refundedCents > 0 && <> (refunded {fmtMoney(b.payment.refundedCents, b.currency)})</>}
              </div>
              <div className="sub">{b.client.email}</div>
              {b.notes && <div className="note-box"><b>Client note:</b> {b.notes}</div>}
            </div>
            <div className="session-actions">
              {b.canJoin && b.status === 'confirmed' && (
                <Button className="sm" disabled={!joinOpen} title={joinOpen ? '' : `Opens ${b.joinOpensAt ? relative(b.joinOpensAt) : ''}`} onClick={() => navigate(`/call/${b.id}`)}>
                  {joinOpen ? 'Join call' : `Join opens ${fmtTime(b.joinOpensAt!)}`}
                </Button>
              )}
              {b.canMarkOutcome && (
                <>
                  {b.status !== 'completed' && <Button variant="ghost" className="sm" loading={action.isPending} onClick={() => action.mutate({ id: b.id, action: 'outcome', status: 'completed' })}>Mark completed</Button>}
                  {b.status !== 'no_show' && <Button variant="ghost" className="sm" loading={action.isPending} onClick={() => action.mutate({ id: b.id, action: 'outcome', status: 'no_show' })}>No-show</Button>}
                </>
              )}
              {b.canCancel && <Button variant="danger" className="sm" onClick={() => setCancelling(b)}>Cancel</Button>}
            </div>
          </div>
        )
      })}

      <Modal
        open={!!cancelling}
        title="Cancel this session?"
        onClose={() => setCancelling(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setCancelling(null)}>Keep session</Button>
          <Button variant="primary" loading={action.isPending} onClick={() => cancelling && action.mutate({ id: cancelling.id, action: 'cancel' }, { onSuccess: () => setCancelling(null) })}>Cancel and refund</Button>
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
