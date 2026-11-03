import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateProgram, usePrograms } from '../api/hooks'
import type { ProgramContent, ProgramStatus } from '../api/types'
import { Clock, Eye, Lock, Plus } from '../components/icons'
import { Button, Card, Empty, ErrorBanner, Field, Hero, Modal, Pill, Spinner, Textarea } from '../components/ui'
import { fmtDateTime } from '../lib/format'

export function ProgramStatusPill({ status }: { status: ProgramStatus }) {
  if (status === 'active') return <Pill tone="green" icon={<Eye size={13} />}>Live in app</Pill>
  if (status === 'coming_soon') return <Pill tone="yellow" icon={<Clock size={13} />}>Coming soon</Pill>
  return <Pill tone="stone" icon={<Lock size={13} />}>Hidden</Pill>
}

export default function Programs() {
  const programs = usePrograms()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)

  return (
    <>
      <Hero
        eyebrow="Admin"
        title="Programs"
        subtitle="The programs users see in the app. Changes are live as soon as you save."
        actions={<Button size="lg" className="btn-light" onClick={() => setAdding(true)}><Plus size={18} />Add program</Button>}
      />
      <div className="page-body">
        <Card title={`${programs.data?.length ?? 0} programs`}>
          {programs.isLoading && <Spinner />}
          <ErrorBanner error={programs.error} />
          {programs.data?.length === 0 && <Empty title="No programs yet">Add a program, or import the app's content files on the server.</Empty>}
          {!!programs.data?.length && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Order</th><th>Program</th><th>Content</th><th>Status</th><th>Last updated</th></tr></thead>
                <tbody>
                  {programs.data.map((p) => (
                    <tr key={p.id} className="clickable" onClick={() => navigate(`/programs/${p.id}`)}>
                      <td className="muted">{p.displayOrder}</td>
                      <td><b>{p.title}</b><span className="sub">{p.short ?? p.id}</span></td>
                      <td className="muted">{p.counts.phases} phases · {p.counts.lessons} lessons · {p.counts.videos} videos · {p.counts.quizzes} quizzes</td>
                      <td><ProgramStatusPill status={p.status} /></td>
                      <td className="muted">{p.updatedAt ? fmtDateTime(p.updatedAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      <AddProgram open={adding} onClose={() => setAdding(false)} onCreated={(id) => navigate(`/programs/${id}`)} />
    </>
  )
}

function AddProgram({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const create = useCreateProgram()
  const [json, setJson] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const close = () => { setJson(''); setParseError(null); create.reset(); onClose() }

  function submit() {
    let content: ProgramContent
    try { content = JSON.parse(json) } catch { setParseError('This isn\'t valid JSON. Check for a missing comma or bracket.'); return }
    setParseError(null)
    create.mutate(content, { onSuccess: (p) => { close(); onCreated(p.id) } })
  }

  return (
    <Modal open={open} title="Add a program" onClose={close}
      footer={<><Button variant="secondary" size="lg" onClick={close}>Cancel</Button><Button size="lg" loading={create.isPending} disabled={!json.trim()} onClick={submit}>Add program</Button></>}>
      <p className="muted">Paste the program file (same format as the app's <code>mhfa_program.json</code>). It needs a new <code>id</code>, a <code>title</code> and at least one phase. New programs start <b>hidden</b>, so you can check them before users see them.</p>
      <ErrorBanner error={parseError ? new Error(parseError) : create.error} />
      <Field label="Program JSON">{(id) => <Textarea id={id} className="input code" rows={14} value={json} onChange={(e) => setJson(e.target.value)} placeholder='{ "id": "sleep", "title": "Better sleep", "phases": [ … ] }' spellCheck={false} />}</Field>
    </Modal>
  )
}
