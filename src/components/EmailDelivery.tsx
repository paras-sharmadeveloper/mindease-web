import { useState, type FormEvent } from 'react'
import { useEmailStatus, useSendTestEmail } from '../api/hooks'
import { fmtDateTime, relative } from '../lib/format'
import { Check, Clock, Cross } from './icons'
import { Button, Card, ErrorBanner, Field, Input, Pill, Spinner, SuccessBanner } from './ui'

/** Admin: are emails (password reset, email change) actually being sent? */
export default function EmailDelivery({ defaultTo }: { defaultTo: string }) {
  const status = useEmailStatus(true)
  const send = useSendTestEmail()
  const [to, setTo] = useState(defaultTo)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (to.trim()) send.mutate(to.trim())
  }

  const s = status.data?.settings
  const q = status.data?.queue
  // Queued emails more than 2 minutes old (when the status was loaded) mean nobody is sending them.
  const stuck = !!(q?.waiting && q.oldestWaitingAt && status.dataUpdatedAt - new Date(q.oldestWaitingAt).getTime() > 2 * 60_000)

  return (
    <Card title="Email delivery" actions={<Button variant="secondary" size="sm" onClick={() => status.refetch()} loading={status.isFetching}>Refresh</Button>}>
      <p className="muted" style={{ marginTop: -6 }}>Password reset and email confirmation emails use these settings. Send yourself a test email to check they work.</p>
      {status.isLoading && <Spinner />}
      <ErrorBanner error={status.error} />

      {s && q && (
        <dl className="kv">
          <dt>Status</dt>
          <dd>{!s.sendsEmail
            ? <Pill tone="red" icon={<Cross size={12} />}>Not sending: MAIL_MAILER is “{s.mailer}”</Pill>
            : send.isSuccess ? <Pill tone="green" icon={<Check size={13} />}>Working: test email sent</Pill>
              : send.isError ? <Pill tone="red" icon={<Cross size={12} />}>Not working: test email failed</Pill>
                : <Pill tone="stone">Set to send real emails. Send a test to check</Pill>}</dd>

          <dt>Mail server</dt>
          <dd>{s.host ? <>{s.host}:{s.port}{s.encryption && <span className="muted"> · {s.encryption}</span>}{s.username && <span className="muted"> · {s.username}</span>}</> : <span className="muted">{s.mailer}</span>}</dd>

          <dt>Sent from</dt>
          <dd>{s.fromName} &lt;{s.fromAddress}&gt;</dd>

          <dt>Waiting to send</dt>
          <dd>
            {q.waiting === null ? <span className="muted">{q.connection === 'sync' ? 'Sent straight away (no queue)' : '—'}</span>
              : q.waiting === 0 ? <Pill tone="green" icon={<Check size={13} />}>None</Pill>
                : <Pill tone={stuck ? 'red' : 'yellow'} icon={<Clock size={13} />}>{q.waiting} email{q.waiting === 1 ? '' : 's'}{q.oldestWaitingAt && `, oldest ${relative(q.oldestWaitingAt)}`}</Pill>}
          </dd>

          <dt>Failed</dt>
          <dd>
            {!q.failed ? <Pill tone="green" icon={<Check size={13} />}>None</Pill>
              : <><Pill tone="red" icon={<Cross size={12} />}>{q.failed}</Pill>{q.lastFailedAt && <span className="muted"> · last {fmtDateTime(q.lastFailedAt)}</span>}
                {q.lastError && <code className="error-line">{q.lastError}</code>}</>}
          </dd>
        </dl>
      )}

      {stuck && (
        <div className="banner banner-error" role="alert">
          <span>Emails are waiting but not being sent, so the queue worker probably isn't running. On the server, run <code>supervisorctl status mindease-worker</code> and start it with <code>supervisorctl start mindease-worker</code>.</span>
        </div>
      )}

      <form onSubmit={submit} noValidate className="test-mail">
        {send.isSuccess && (s?.sendsEmail
          ? <SuccessBanner>Test email sent to {send.data.to}. Check the inbox, and the spam folder, in a minute or two.</SuccessBanner>
          : <div className="banner banner-info" role="status"><span>Not delivered: with MAIL_MAILER “{s?.mailer}” the email was only written to the server log. Set the SMTP settings in the server's .env to send real emails.</span></div>)}
        <ErrorBanner error={send.error} />
        <Field label="Send a test email to">{(id) => <Input id={id} type="email" value={to} onChange={(e) => { setTo(e.target.value); send.reset() }} placeholder="you@example.com" />}</Field>
        <Button type="submit" size="lg" loading={send.isPending} disabled={!to.trim()}>Send test email</Button>
      </form>
    </Card>
  )
}
