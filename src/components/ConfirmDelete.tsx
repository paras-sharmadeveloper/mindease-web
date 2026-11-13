import { useId, useState, type ReactNode } from 'react'
import { Trash } from './icons'
import { Button, Modal } from './ui'

const WORD = 'CONFIRM'

type Props = {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Delete popup that only enables Delete after the user types CONFIRM (any case), so a stray click can't delete. */
export default function ConfirmDelete(props: Props) {
  // A new key each time it opens: the typed word always starts empty.
  return <ConfirmDeleteDialog key={props.open ? 'open' : 'closed'} {...props} />
}

function ConfirmDeleteDialog({ open, title, children, confirmLabel = 'Delete', loading, onConfirm, onClose }: Props) {
  const [typed, setTyped] = useState('')
  const id = useId()
  const ok = typed.trim().toUpperCase() === WORD

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Keep</Button>
        <Button variant="dark" disabled={!ok} loading={loading} onClick={() => ok && onConfirm()}><Trash size={16} />{confirmLabel}</Button>
      </>}
    >
      {children}
      <form className="confirm-type" onSubmit={(e) => { e.preventDefault(); if (ok && !loading) onConfirm() }}>
        <label htmlFor={id}>Type <b>{WORD}</b> to delete</label>
        <input id={id} className="input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={WORD} autoComplete="off" autoCapitalize="characters" spellCheck={false} autoFocus />
      </form>
    </Modal>
  )
}
