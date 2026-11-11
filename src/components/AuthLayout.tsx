import type { ReactNode } from 'react'
import { Calendar, Users, Video } from './icons'

/** Signed-out screens (sign in, forgot password): brand panel on the left, form on the right. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-hero">
        <span className="blob b1" aria-hidden /><span className="blob b2" aria-hidden />
        <div className="auth-brand"><span className="logo"><img src="/logo.png" alt="" /></span>MindEase</div>
        <div className="auth-copy">
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,.8)', marginBottom: 10 }}>Therapist &amp; admin panel</div>
          <h1>Care for your clients, all in one place</h1>
          <p>See your sessions, set your hours and meet clients by video, right in the browser.</p>
        </div>
        <div className="auth-points">
          <span><i><Calendar size={18} /></i>Sessions and weekly hours</span>
          <span><i><Video size={18} /></i>Secure video calls, never recorded</span>
          <span><i><Users size={18} /></i>Therapist management for admins</span>
        </div>
      </div>
      <div className="auth-form">{children}</div>
    </div>
  )
}
