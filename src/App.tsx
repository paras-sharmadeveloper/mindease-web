import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import Account from './pages/Account'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Sessions from './pages/Sessions'
import TherapistDetail from './pages/TherapistDetail'
import Therapists from './pages/Therapists'

// The Zoom Video SDK is large: load it only when a call is opened.
const Call = lazy(() => import('./pages/Call'))

export default function App() {
  const { me, loading } = useAuth()

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}><Spinner /></div>
  if (!me) return <Routes><Route path="*" element={<Login />} /></Routes>

  return (
    <Routes>
      <Route path="/call/:id" element={<Suspense fallback={<Spinner label="Loading video…" />}><Call /></Suspense>} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="sessions" element={<Sessions />} />
        {me.role === 'admin' && <Route path="therapists" element={<Therapists />} />}
        <Route path="therapists/:id" element={<TherapistDetail />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
