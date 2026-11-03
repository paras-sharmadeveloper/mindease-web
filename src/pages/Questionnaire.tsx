import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import { useQuestionnaire, useSaveQuestionnaire } from '../api/hooks'
import type { Question, Questionnaire, QuestionType } from '../api/types'
import { ArrowDown, ArrowUp, Plus, Trash } from '../components/icons'
import { Button, Card, Empty, ErrorBanner, Field, Hero, Input, Select, Spinner, SuccessBanner } from '../components/ui'
import { fmtDateTime } from '../lib/format'

const TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single', label: 'Single choice (one answer)' },
  { value: 'multi', label: 'Multiple choice (several answers)' },
  { value: 'mood', label: 'Mood scale' },
]

/** Draft row: `key` is for React only and never sent. `isNew` lets the admin still edit the id. */
interface Draft { key: number; isNew: boolean; savedValues: string[]; question: Question }

let nextKey = 1
const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64)
const toDrafts = (qs: Question[]): Draft[] => qs.map((q) => ({ key: nextKey++, isNew: false, savedValues: q.options.map((o) => o.v), question: q }))

export default function QuestionnaireEditor() {
  const doc = useQuestionnaire()
  if (doc.error) return <ErrorBanner error={doc.error} />
  if (!doc.data) return <Spinner />
  return <Editor doc={doc.data} />
}

function Editor({ doc }: { doc: Questionnaire }) {
  const save = useSaveQuestionnaire()
  const [drafts, setDrafts] = useState<Draft[]>(() => toDrafts(doc.questions))

  const original = useMemo(() => JSON.stringify(doc.questions), [doc])
  const current = drafts.map((d) => d.question)
  const dirty = JSON.stringify(current) !== original

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const setQ = (i: number, q: Partial<Question>) => setDrafts(drafts.map((d, j) => (j === i ? { ...d, question: { ...d.question, ...q } } : d)))
  const move = (i: number, by: number) => {
    const next = [...drafts]
    const [d] = next.splice(i, 1)
    next.splice(i + by, 0, d)
    setDrafts(next)
  }
  const add = () => setDrafts([...drafts, {
    key: nextKey++, isNew: true, savedValues: [],
    question: { id: '', type: 'single', q: '', options: [{ v: '', label: '' }, { v: '', label: '' }] },
  }])

  function submit() {
    const questions = current.map((q) => {
      const out: Question = { ...q }
      if (q.type !== 'multi' || !q.exclusive) delete out.exclusive
      return out
    })
    save.mutate(questions, { onSuccess: (data) => setDrafts(toDrafts(data.questions)) })
  }

  return (
    <>
      <Hero eyebrow="Admin" title="Onboarding questionnaire"
        subtitle={<>The questions users answer after signing up. Saved changes are live in the app.{doc.updatedAt && <> Last saved {fmtDateTime(doc.updatedAt)}.</>}</>}
        actions={<Button size="lg" className="btn-light" onClick={add}><Plus size={18} />Add question</Button>} />

      <div className="page-body">
        <div className="banner banner-info">
          <span>Users' answers are saved against each question's <b>ID</b> and each option's <b>value</b>, so those can't change once saved. Wording can change any time. The app's recommendations use the questions it already knows; a new question is shown and its answers are saved, but it only affects recommendations after the app is updated to use it.</span>
        </div>
        {save.isSuccess && !dirty && <SuccessBanner>Questionnaire saved. The app shows it the next time it loads the questions.</SuccessBanner>}
        <SaveErrors error={save.error} />

        {drafts.length === 0 && <Card><Empty title="No questions">Add the first question.</Empty></Card>}
        {drafts.map((d, i) => (
          <QuestionCard key={d.key} draft={d} index={i} total={drafts.length}
            onChange={(q) => setQ(i, q)}
            onMove={(by) => move(i, by)}
            onRemove={() => setDrafts(drafts.filter((_, j) => j !== i))} />
        ))}

        <div className={`save-bar ${dirty ? 'dirty' : ''}`}>
          <span className="muted">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
          <div className="row">
            <Button variant="secondary" size="lg" disabled={!dirty || save.isPending} onClick={() => { setDrafts(toDrafts(doc.questions)); save.reset() }}>Discard changes</Button>
            <Button size="lg" loading={save.isPending} disabled={!dirty} onClick={submit}>Save questionnaire</Button>
          </div>
        </div>
      </div>
    </>
  )
}

function QuestionCard({ draft, index, total, onChange, onMove, onRemove }: {
  draft: Draft; index: number; total: number
  onChange: (q: Partial<Question>) => void; onMove: (by: number) => void; onRemove: () => void
}) {
  const q = draft.question
  const setOption = (j: number, label: string, v?: string) => {
    const options = q.options.map((o, k) => {
      if (k !== j) return o
      const locked = draft.savedValues.includes(o.v)
      // New options get their value from the label until the admin types one.
      const auto = !locked && (o.v === '' || o.v === slug(o.label))
      return { ...o, label, v: v ?? (auto ? slug(label) : o.v) }
    })
    onChange({ options })
  }

  return (
    <Card title={`Question ${index + 1}`} actions={<>
      <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up"><ArrowUp size={16} /></Button>
      <Button variant="ghost" size="sm" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Move down"><ArrowDown size={16} /></Button>
      <Button variant="ghost" size="sm" onClick={onRemove}><Trash size={16} />Remove</Button>
    </>}>
      <div className="form-grid">
        <div className="span-2">
          <Field label="Question">{(id) => <Input id={id} value={q.q} placeholder="How have you been sleeping?"
            onChange={(e) => onChange({ q: e.target.value, ...(draft.isNew && (q.id === '' || q.id === slug(q.q)) ? { id: slug(e.target.value) } : {}) })} />}</Field>
        </div>
        <Field label="Answer type">{(id) => <Select id={id} value={q.type} onChange={(e) => onChange({ type: e.target.value as QuestionType })}>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>}</Field>
        <Field label="Question ID" hint={draft.isNew ? 'Lowercase letters, numbers and _. Can\'t change after saving.' : 'Saved answers use this ID, so it can\'t change.'}>
          {(id) => <Input id={id} value={q.id} disabled={!draft.isNew} onChange={(e) => onChange({ id: slug(e.target.value) })} placeholder="sleep" />}
        </Field>
      </div>

      <h3 className="sub-head">Options</h3>
      <div className="options-list">
        {q.options.map((o, j) => {
          const locked = draft.savedValues.includes(o.v)
          return (
            <div className="option-row" key={j}>
              <Input value={o.label} placeholder={`Option ${j + 1}`} onChange={(e) => setOption(j, e.target.value)} aria-label={`Option ${j + 1} label`} />
              <Input value={o.v} disabled={locked} placeholder="value" onChange={(e) => setOption(j, o.label, slug(e.target.value))} aria-label={`Option ${j + 1} value`} title={locked ? 'Saved answers use this value, so it can\'t change.' : 'Saved with the answer. Lowercase letters, numbers and _.'} />
              <Button variant="ghost" size="sm" disabled={q.options.length <= 2} onClick={() => onChange({ options: q.options.filter((_, k) => k !== j), ...(q.exclusive === o.v ? { exclusive: null } : {}) })} aria-label={`Remove option ${j + 1}`}><Trash size={16} /></Button>
            </div>
          )
        })}
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <Button variant="secondary" size="sm" disabled={q.options.length >= 20} onClick={() => onChange({ options: [...q.options, { v: '', label: '' }] })}><Plus size={15} />Add option</Button>
      </div>

      {q.type === 'multi' && (
        <div style={{ marginTop: 16, maxWidth: 420 }}>
          <Field label="&quot;None of these&quot; option" hint="Picking it clears the other answers. Optional.">
            {(id) => <Select id={id} value={q.exclusive ?? ''} onChange={(e) => onChange({ exclusive: e.target.value || null })}>
              <option value="">No exclusive option</option>
              {q.options.filter((o) => o.v).map((o) => <option key={o.v} value={o.v}>{o.label || o.v}</option>)}
            </Select>}
          </Field>
        </div>
      )}
    </Card>
  )
}

/** Turns "questions.2.options.0.label" errors into "Question 3, option 1: …". */
function SaveErrors({ error }: { error: unknown }) {
  if (!(error instanceof ApiError) || !Object.keys(error.fields).length) return <ErrorBanner error={error} />
  const lines = Object.entries(error.fields).flatMap(([field, msgs]) => {
    const m = field.match(/^questions\.(\d+)(?:\.options\.(\d+))?/)
    const where = m ? `Question ${Number(m[1]) + 1}${m[2] !== undefined ? `, option ${Number(m[2]) + 1}` : ''}: ` : ''
    return msgs.map((msg) => where + msg.replace(/questions\.\d+(\.options\.\d+)?\./g, ''))
  })
  return (
    <div className="banner banner-error" role="alert">
      <div><b>Not saved. Please fix:</b><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{[...new Set(lines)].map((l) => <li key={l}>{l}</li>)}</ul></div>
    </div>
  )
}
