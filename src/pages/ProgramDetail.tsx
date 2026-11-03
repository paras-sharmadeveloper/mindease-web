import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useProgram, useReplaceProgramContent, useUpdateProgram } from '../api/hooks'
import type { ProgramContent, ProgramDetail as Program, ProgramStatus } from '../api/types'
import { Check } from '../components/icons'
import { Button, Card, ErrorBanner, Field, Hero, Input, Select, Spinner, SuccessBanner, Textarea, fieldError } from '../components/ui'
import { ProgramStatusPill } from './Programs'

const STATUS_OPTIONS: { value: ProgramStatus; label: string }[] = [
  { value: 'active', label: 'Live in app: users can open it' },
  { value: 'coming_soon', label: 'Coming soon: listed, not open yet' },
  { value: 'hidden', label: 'Hidden: not shown in the app' },
]

export default function ProgramDetail() {
  const { id = '' } = useParams()
  const program = useProgram(id)

  if (program.isLoading) return <Spinner />
  if (program.error || !program.data) return <ErrorBanner error={program.error ?? new Error('Not found')} />
  const p = program.data

  return (
    <>
      <Hero back="/programs" eyebrow="Program" title={p.title}
        subtitle={<><span>{p.id}</span><span>·</span><span>{p.counts.phases} phases</span>{p.contentVersion && <><span>·</span><span>version {p.contentVersion}</span></>}<ProgramStatusPill status={p.status} /></>} />
      <div className="page-body">
        <Details key={p.id} program={p} />
        <Overview content={p.content} />
        <ContentEditor key={`json-${p.id}`} program={p} />
      </div>
    </>
  )
}

function Details({ program }: { program: Program }) {
  const update = useUpdateProgram(program.id)
  const [title, setTitle] = useState(program.title)
  const [short, setShort] = useState(program.short ?? '')
  const [status, setStatus] = useState<ProgramStatus>(program.status)
  const [order, setOrder] = useState(String(program.displayOrder))
  const [cover, setCover] = useState(program.coverImage ?? '')
  const err = (f: string) => fieldError(update.error, f)

  function submit(e: FormEvent) {
    e.preventDefault()
    update.mutate({ title: title.trim(), short: short.trim() || null, status, displayOrder: Number(order) || 0, coverImage: cover.trim() || null })
  }

  return (
    <Card title="Details">
      {update.isSuccess && <SuccessBanner>Saved. The app shows the change straight away.</SuccessBanner>}
      <form onSubmit={submit} noValidate>
        <ErrorBanner error={update.error && !['title', 'short', 'status', 'displayOrder', 'coverImage'].some(err) ? update.error : null} />
        <div className="form-grid">
          <Field label="Title" error={err('title')}>{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} required />}</Field>
          <Field label="Short description" error={err('short')} hint="One line under the title in the Programs tab.">{(id) => <Input id={id} value={short} onChange={(e) => setShort(e.target.value)} />}</Field>
          <Field label="Status" error={err('status')} hint={status === 'hidden' ? 'Users who started it keep their progress, but can\'t open it while it is hidden.' : undefined}>
            {(id) => <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as ProgramStatus)}>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>}
          </Field>
          <Field label="Display order" error={err('displayOrder')} hint="Lower numbers show first.">{(id) => <Input id={id} type="number" min="0" value={order} onChange={(e) => setOrder(e.target.value)} />}</Field>
          <div className="span-2">
            <Field label="Cover image" error={err('coverImage')} hint="An image URL or the app's asset path. Optional.">{(id) => <Input id={id} value={cover} onChange={(e) => setCover(e.target.value)} />}</Field>
          </div>
        </div>
        <div className="form-actions"><Button type="submit" size="lg" loading={update.isPending} disabled={!title.trim()}>Save details</Button></div>
      </form>
    </Card>
  )
}

const mins = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function Overview({ content }: { content: ProgramContent }) {
  return (
    <Card title="Content">
      <p className="muted" style={{ marginTop: -6 }}>What users see in each phase. To change it, edit the JSON below.</p>
      <div className="phases">
        {content.phases.map((ph, i) => (
          <details key={ph.id} className="phase" open={i === 0}>
            <summary><b>Phase {ph.number ?? i + 1}: {ph.title}</b><span className="muted">{ph.lessons?.length ?? 0} lessons · {ph.videos?.length ?? 0} videos · {ph.activity ? 'activity' : 'no activity'} · {ph.quiz ? `${ph.quiz.questions.length}-question quiz` : 'no quiz'}</span></summary>
            {ph.description && <p className="muted">{ph.description}</p>}
            <div className="phase-grid">
              <section><h3>Lessons</h3><ul>{(ph.lessons ?? []).map((l) => <li key={l.id}>{l.title}{l.minutes ? <span className="muted"> · {l.minutes} min</span> : null}</li>)}</ul></section>
              <section><h3>Videos</h3><ul>{(ph.videos ?? []).map((v) => <li key={v.id}>{v.title} <span className="muted">· {mins(v.duration)}{v.mediaUrl ? '' : ' · no video file yet'}</span></li>)}</ul></section>
              {ph.activity && <section><h3>Activity: {ph.activity.title}</h3><ul>{(ph.activity.prompts ?? []).map((q) => <li key={q.id}>{q.q}</li>)}</ul></section>}
              {ph.quiz && (
                <section><h3>Quiz{ph.quiz.passThreshold ? ` (pass ${ph.quiz.passThreshold}%)` : ''}</h3>
                  <ol>{ph.quiz.questions.map((q) => <li key={q.id}>{q.q} <span className="muted"><Check size={12} /> {q.options[q.answer]}</span></li>)}</ol>
                </section>
              )}
            </div>
          </details>
        ))}
      </div>
    </Card>
  )
}

function ContentEditor({ program }: { program: Program }) {
  const replace = useReplaceProgramContent(program.id)
  const [json, setJson] = useState(() => JSON.stringify(program.content, null, 2))
  const [parseError, setParseError] = useState<string | null>(null)
  const changed = json !== JSON.stringify(program.content, null, 2)

  function save() {
    let content: ProgramContent
    try { content = JSON.parse(json) } catch { setParseError('This isn\'t valid JSON. Check for a missing comma, quote or bracket.'); return }
    setParseError(null)
    replace.mutate(content, { onSuccess: (saved) => setJson(JSON.stringify(saved.content, null, 2)) })
  }

  return (
    <Card title="Edit content (JSON)" actions={changed && <Button variant="secondary" size="sm" onClick={() => { setJson(JSON.stringify(program.content, null, 2)); setParseError(null); replace.reset() }}>Discard changes</Button>}>
      <p className="muted" style={{ marginTop: -6 }}>
        The full program file the app receives. Keep every <code>id</code> the same: users' progress is saved against them, so lessons, videos or phases that users already have progress on can't be removed. Changing wording is always safe.
      </p>
      {replace.isSuccess && !changed && <SuccessBanner>Content saved. The app picks it up the next time it loads the program.</SuccessBanner>}
      <ErrorBanner error={parseError ? new Error(parseError) : replace.error} />
      <Textarea className="input code" rows={22} value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} aria-label="Program JSON" />
      <div className="form-actions"><Button size="lg" loading={replace.isPending} disabled={!changed} onClick={save}>Save content</Button></div>
    </Card>
  )
}
