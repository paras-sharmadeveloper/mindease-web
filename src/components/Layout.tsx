import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth, useMe } from '../auth/AuthContext'

export default function Layout() {
  const me = useMe()
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const isAdmin = me.role === 'admin'

  const links = [
    { to: '/', label: 'Dashboard', icon: '◧', end: true },
    { to: '/sessions', label: 'Sessions', icon: '◷' },
    ...(isAdmin ? [{ to: '/therapists', label: 'Therapists', icon: '☺' }] : []),
    ...(me.therapist ? [{ to: `/therapists/${me.therapist.id}`, label: 'My profile & hours', icon: '✎' }] : []),
    { to: '/account', label: 'Account', icon: '⚙' },
  ]

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><span className="logo">M</span><div><b>MindEase</b><small>{isAdmin ? 'Admin panel' : 'Therapist panel'}</small></div></div>
        <nav onClick={() => setOpen(false)}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}><span className="nav-icon" aria-hidden>{l.icon}</span>{l.label}</NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="who"><span className="avatar">{me.user.name.slice(0, 1)}</span><div><b>{me.user.name}</b><small>{me.user.email}</small></div></div>
          <button className="btn btn-ghost full" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="content">
        <header className="topbar">
          <button className="icon-btn menu" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <span className="topbar-title">MindEase</span>
        </header>
        <main className="main"><Outlet /></main>
      </div>
    </div>
  )
}
