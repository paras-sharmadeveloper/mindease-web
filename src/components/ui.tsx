import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { STATUS_LABEL } from '../lib/format'
import { Ban, Calendar, Check, ChevronLeft, Clock, Cross, Eye, EyeOff, Lock } from './icons'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'

/** Pill buttons. `size="lg"` is the 56px primary from the design guide (forms, main actions). */
export function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; loading?: boolean }) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading && <span className="spinner sm" aria-hidden />}
      {children}
    </button>
  )
}

export function Field({ label, error, hint, children }: { label: string; error?: string | null; hint?: ReactNode; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {error ? <div className="field-error" role="alert"><Cross size={13} /> {error}</div> : hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  )
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input className="input" {...p} />
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className="input" {...p} />
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select className="input" {...p} />

/** Password input with a show/hide eye toggle. */
export function PasswordInput(p: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [shown, setShown] = useState(false)
  return (
    <div className="password">
      <input className="input" type={shown ? 'text' : 'password'} {...p} />
      <button type="button" className="eye" onClick={() => setShown(!shown)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}>
        {shown ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  )
}

/** Live checklist of what the password still needs (words + icon, never colour alone). */
export function PasswordRules({ password, confirm, current }: { password: string; confirm?: string; current?: string }) {
  const rules = [
    { ok: password.length >= 8, label: 'At least 8 characters' },
    ...(current !== undefined ? [{ ok: password.length > 0 && password !== current, label: 'Different from your current password' }] : []),
    ...(confirm !== undefined ? [{ ok: password.length > 0 && password === confirm, label: 'Both passwords match' }] : []),
  ]
  return (
    <ul className="rules" aria-label="Password requirements">
      {rules.map((r) => (
        <li key={r.label} className={r.ok ? 'ok' : ''}>
          <span className="rule-icon">{r.ok ? <Check size={12} /> : null}</span>{r.label}
          <span className="sr-only">{r.ok ? ' (done)' : ' (needed)'}</span>
        </li>
      ))}
    </ul>
  )
}

/** Field error from an API validation error, matched by the field name the API reports. */
export function fieldError(error: unknown, field: string): string | null {
  if (!(error instanceof ApiError)) return null
  return error.fields[field]?.[0] ?? (error.field === field ? error.message : null)
}

export function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null
  const msg = error instanceof Error ? error.message : 'Something went wrong.'
  return <div className="banner banner-error" role="alert"><Cross size={16} /><span>{msg}</span></div>
}

export function SuccessBanner({ children }: { children: ReactNode }) {
  return <div className="banner banner-ok" role="status"><Check size={16} /><span>{children}</span></div>
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <div className="loading"><span className="spinner" aria-hidden /> {label}</div>
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><span className="empty-icon"><Calendar size={26} /></span><b>{title}</b>{children && <p>{children}</p>}</div>
}

const STATUS_ICON: Record<string, ReactNode> = {
  confirmed: <Calendar size={13} />, completed: <Check size={13} />, cancelled: <Cross size={12} />,
  no_show: <Ban size={13} />, pending: <Clock size={13} />,
}

/** Status pills from the design guide: always words + icon. */
export function StatusBadge({ status }: { status: string }) {
  return <span className={`pill pill-${status}`}>{STATUS_ICON[status]}{STATUS_LABEL[status] ?? status}</span>
}

export function Pill({ tone, icon, children }: { tone: 'green' | 'yellow' | 'red' | 'stone' | 'purple'; icon?: ReactNode; children: ReactNode }) {
  return <span className={`pill pill-${tone}`}>{icon}{children}</span>
}

export const ActivePill = ({ active }: { active: boolean }) =>
  active ? <Pill tone="green" icon={<Check size={13} />}>Shown in app</Pill> : <Pill tone="stone" icon={<Lock size={13} />}>Hidden</Pill>

export function Card({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && <header className="card-head">{title && <h2>{title}</h2>}<div className="card-actions">{actions}</div></header>}
      {children}
    </section>
  )
}

export function Modal({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className="modal" onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose() }}>
      <header className="modal-head"><h2>{title}</h2><button className="round-btn" onClick={onClose} aria-label="Close"><Cross size={16} /></button></header>
      <div className="modal-body">{children}</div>
      {footer && <footer className="modal-foot">{footer}</footer>}
    </dialog>
  )
}

/** Circular back button (44px, outlined) from the design guide. `onHero` = white outline on red. */
export function BackButton({ to, label = 'Back', onHero }: { to?: string; label?: string; onHero?: boolean }) {
  const navigate = useNavigate()
  return (
    <button className={`back ${onHero ? 'on-hero' : ''}`} onClick={() => (to ? navigate(to) : navigate(-1))} aria-label={label} title={label}>
      <ChevronLeft size={22} />
    </button>
  )
}

/** Red hero header (bottom radius 34, two darker blobs), like the app's screen headers. */
export function Hero({ eyebrow, title, subtitle, actions, back }: { eyebrow?: string; title: string; subtitle?: ReactNode; actions?: ReactNode; back?: string }) {
  return (
    <header className="hero">
      <span className="blob b1" aria-hidden /><span className="blob b2" aria-hidden />
      <div className="hero-inner">
        {back && <BackButton to={back} onHero />}
        <div className="hero-text">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          {subtitle && <div className="hero-sub">{subtitle}</div>}
        </div>
        {actions && <div className="hero-actions">{actions}</div>}
      </div>
    </header>
  )
}

/** Chip-style tabs: default white with stone outline, selected brown (reflection chip style). */
export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="chips-row" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={`chip-btn ${value === o.value ? 'on' : ''}`} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

/** Square checkbox (multi-select style from the guide). */
export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className={`option ${checked ? 'on' : ''}`}>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="option-label">{children}</span>
      <span className="box" aria-hidden>{checked && <Check size={16} />}</span>
    </label>
  )
}
