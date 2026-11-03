import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth, useMe } from '../auth/AuthContext'
import { Book, Calendar, Edit, Home, ListChecks, LogOut, Menu, Settings, Users } from './icons'

export default function Layout() {
  const me = useMe()
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const isAdmin = me.role === 'admin'

  const links = [
    { to: '/', label: 'Home', icon: <Home />, end: true },
    { to: '/sessions', label: 'Sessions', icon: <Calendar /> },
    ...(isAdmin ? [
      { to: '/therapists', label: 'Therapists', icon: <Users /> },
      { to: '/programs', label: 'Programs', icon: <Book /> },
      { to: '/questionnaire', label: 'Questionnaire', icon: <ListChecks /> },
    ] : []),
    ...(me.therapist ? [{ to: `/therapists/${me.therapist.id}`, label: 'Profile & hours', icon: <Edit /> }] : []),
    { to: '/account', label: 'Account', icon: <Settings /> },
  ]

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><span className="logo">M</span><div><b>MindEase</b><small>{isAdmin ? 'Admin panel' : 'Therapist panel'}</small></div></div>
        <nav onClick={() => setOpen(false)} aria-label="Main">
          {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end}>{l.icon}{l.label}</NavLink>)}
        </nav>
        <div className="sidebar-foot">
          <div className="who"><span className="avatar">{me.user.name.slice(0, 1)}</span><div><b>{me.user.name}</b><small>{me.user.email}</small></div></div>
          <button className="btn btn-secondary btn-md full" onClick={signOut}><LogOut size={18} />Sign out</button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="content">
        <header className="topbar">
          <button className="round-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
          <span className="topbar-title">MindEase</span>
        </header>
        <main className="main"><Outlet /></main>
      </div>
    </div>
  )
}
