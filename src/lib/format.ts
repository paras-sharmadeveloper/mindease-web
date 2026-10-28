// Times come from the API in UTC and are shown in the viewer's local timezone.

export const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone

export const fmtDate = (iso: string, tz?: string) =>
  new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: tz }).format(new Date(iso))

export const fmtTime = (iso: string, tz?: string) =>
  new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date(iso))

export const fmtDateTime = (iso: string, tz?: string) =>
  new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date(iso))

export const fmtMoney = (cents: number, currency = 'aud') =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100)

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function relative(iso: string): string {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  const rtf = new Intl.RelativeTimeFormat('en-AU', { numeric: 'auto' })
  if (Math.abs(mins) < 60) return rtf.format(mins, 'minute')
  if (Math.abs(mins) < 60 * 24) return rtf.format(Math.round(mins / 60), 'hour')
  return rtf.format(Math.round(mins / 1440), 'day')
}

/** datetime-local input value (local time) <-> ISO UTC */
export const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
export const fromLocalInput = (v: string) => new Date(v).toISOString()

export const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting payment', confirmed: 'Confirmed', cancelled: 'Cancelled', completed: 'Completed', no_show: 'No-show',
}
