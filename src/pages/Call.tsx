import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ZoomVideo, { VideoQuality, type Participant, type VideoPlayer } from '@zoom/videosdk'
import { ApiError } from '../api/client'
import { fetchVideoToken, useBooking } from '../api/hooks'
import { ChevronLeft, Mic, MicOff, Phone, Video, VideoOff } from '../components/icons'
import { BackButton, Button } from '../components/ui'
import { fmtDate, fmtTime } from '../lib/format'

type Client = ReturnType<typeof ZoomVideo.createClient>
type Stream = ReturnType<Client['getMediaStream']>
type Phase = 'prejoin' | 'joining' | 'in-call' | 'reconnecting' | 'left' | 'ended' | 'failed'

/**
 * Therapist side of a booked session (Zoom Video SDK for Web, host role).
 * Session name = booking id; the token comes from /panel/bookings/{id}/video-token and is never stored.
 */
export default function Call() {
  const { id = '' } = useParams()
  const booking = useBooking(id)
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('prejoin')
  const [error, setError] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [remote, setRemote] = useState<Participant | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const client = useRef<Client | null>(null)
  const stream = useRef<Stream | null>(null)
  const leaving = useRef(false)
  const selfTile = useRef<HTMLDivElement>(null)
  const remoteTile = useRef<HTMLDivElement>(null)
  const remoteVideoUser = useRef<number | null>(null)

  // ---- media helpers ---------------------------------------------------------------
  const attach = useCallback(async (userId: number, tile: HTMLDivElement | null) => {
    if (!stream.current || !tile) return
    const el = await stream.current.attachVideo(userId, VideoQuality.Video_720P)
    if (el && 'nodeType' in (el as object)) { tile.querySelector('video-player')?.remove(); tile.appendChild(el as VideoPlayer) }
  }, [])

  const detach = useCallback(async (userId: number, tile: HTMLDivElement | null) => {
    if (!stream.current) return
    try { await stream.current.detachVideo(userId) } catch { /* not attached */ }
    tile?.querySelectorAll('video-player').forEach((e) => e.remove())
  }, [])

  const syncRemote = useCallback(async () => {
    const c = client.current
    if (!c) return
    const me = c.getCurrentUserInfo()
    const other = c.getAllUser().find((u) => u.userId !== me?.userId) ?? null
    setRemote(other)
    const wantVideo = other?.bVideoOn ? other.userId : null
    if (wantVideo !== remoteVideoUser.current) {
      if (remoteVideoUser.current !== null) await detach(remoteVideoUser.current, remoteTile.current)
      if (wantVideo !== null) await attach(wantVideo, remoteTile.current)
      remoteVideoUser.current = wantVideo
    }
  }, [attach, detach])

  // ---- join / leave ----------------------------------------------------------------
  const join = useCallback(async () => {
    setError(null)
    setPhase('joining')
    leaving.current = false
    try {
      const t = await fetchVideoToken(id)
      const c = client.current ?? ZoomVideo.createClient()
      client.current = c
      await c.init('en-US', 'Global', { patchJsMedia: true, leaveOnPageUnload: true })

      c.on('user-added', syncRemote)
      c.on('user-removed', syncRemote)
      c.on('user-updated', syncRemote)
      c.on('peer-video-state-change', syncRemote)
      c.on('connection-change', (p) => {
        if (p.state === 'Reconnecting') setPhase('reconnecting')
        else if (p.state === 'Connected') setPhase('in-call')
        else if (p.state === 'Closed' && !leaving.current) setPhase(p.reason === 'ended by host' ? 'ended' : 'failed')
        else if (p.state === 'Fail') { setError('The connection was lost.'); setPhase('failed') }
      })

      await c.join(t.sessionName, t.token, t.displayName)
      stream.current = c.getMediaStream()

      await stream.current.startAudio({ mute: !micOn })
      if (camOn) {
        await stream.current.startVideo()
        await attach(c.getCurrentUserInfo().userId, selfTile.current)
      }
      setPhase('in-call')
      await syncRemote()
    } catch (e) {
      setError(errorMessage(e))
      setPhase('failed')
      try { await client.current?.leave() } catch { /* not joined */ }
    }
  }, [id, micOn, camOn, attach, syncRemote])

  const leave = useCallback(async (endForAll: boolean) => {
    leaving.current = true
    try { await client.current?.leave(endForAll) } catch { /* already gone */ }
    remoteVideoUser.current = null
    setRemote(null)
    setPhase(endForAll ? 'ended' : 'left')
  }, [])

  useEffect(() => () => {
    leaving.current = true
    client.current?.leave().catch(() => {})
    ZoomVideo.destroyClient()
  }, [])

  useEffect(() => {
    if (phase !== 'in-call' && phase !== 'reconnecting') return
    const started = Date.now() - elapsed * 1000
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(t)
  }, [phase])

  // ---- controls --------------------------------------------------------------------
  async function toggleMic() {
    const s = stream.current
    if (!s) return
    if (micOn) await s.muteAudio(); else await s.unmuteAudio()
    setMicOn(!micOn)
  }

  async function toggleCam() {
    const s = stream.current, c = client.current
    if (!s || !c) return
    const self = c.getCurrentUserInfo().userId
    if (camOn) { await s.stopVideo(); await detach(self, selfTile.current) }
    else { await s.startVideo(); await attach(self, selfTile.current) }
    setCamOn(!camOn)
  }

  // ---- render ----------------------------------------------------------------------
  const b = booking.data
  const title = b ? `Session with ${b.client.name}` : 'Session'
  const subtitle = b ? `${fmtDate(b.startsAt)} · ${fmtTime(b.startsAt)} – ${fmtTime(b.endsAt)}` : ''

  if (phase === 'prejoin' || (phase === 'failed' && !client.current?.getCurrentUserInfo())) {
    return <PreJoin title={title} subtitle={subtitle} micOn={micOn} camOn={camOn} setMicOn={setMicOn} setCamOn={setCamOn}
      error={error} onJoin={join} onBack={() => navigate('/sessions')} />
  }

  const inCall = phase === 'in-call' || phase === 'reconnecting'
  return (
    <div className="call">
      <div className="call-top">
        <div className="who-call"><BackButton to="/sessions" label="Back to sessions" /><div><b>{title}</b><div className="muted small">{subtitle}</div></div></div>
        <div className="muted small">{inCall ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')} · ` : ''}End-to-end in the browser · not recorded</div>
      </div>

      <div className="call-stage">
        <video-player-container>
          <div className="tile remote" ref={remoteTile}>
            {!remote && inCall && <div className="placeholder"><span className="avatar">…</span>Waiting for {b?.client.name ?? 'the client'} to join from the app</div>}
            {remote && !remote.bVideoOn && <div className="placeholder"><span className="avatar">{remote.displayName?.slice(0, 1) ?? '?'}</span>{remote.displayName}'s camera is off</div>}
            {remote && <span className="label">{remote.muted && <MicOff size={14} />}{remote.displayName}</span>}
          </div>
          <div className="tile self" ref={selfTile}>
            {!camOn && <div className="placeholder small">Your camera is off</div>}
            <span className="label">{!micOn && <MicOff size={14} />}You</span>
          </div>
        </video-player-container>

        {phase === 'joining' && <Overlay title="Joining…" />}
        {phase === 'reconnecting' && <Overlay title="Reconnecting…" text="Your connection dropped. We're trying to reconnect you." />}
        {(phase === 'left' || phase === 'ended' || phase === 'failed') && (
          <Overlay
            title={phase === 'ended' ? 'Session ended' : phase === 'left' ? 'You left the call' : 'Disconnected'}
            text={phase === 'failed' ? (error ?? 'The call was disconnected.') : phase === 'left' ? 'The session is still open. You can rejoin until it ends.' : undefined}
          >
            <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
              {phase !== 'ended' && <Button onClick={join}>Rejoin</Button>}
              <Link className="btn btn-secondary btn-md" to="/sessions">Back to sessions</Link>
            </div>
          </Overlay>
        )}
      </div>

      <div className="call-bar">
        <button className={`call-btn ${micOn ? '' : 'off'}`} onClick={toggleMic} disabled={!inCall} aria-label={micOn ? 'Mute' : 'Unmute'} title={micOn ? 'Mute' : 'Unmute'}>{micOn ? <Mic size={22} /> : <MicOff size={22} />}</button>
        <button className={`call-btn ${camOn ? '' : 'off'}`} onClick={toggleCam} disabled={!inCall} aria-label={camOn ? 'Turn camera off' : 'Turn camera on'} title={camOn ? 'Camera off' : 'Camera on'}>{camOn ? <Video size={22} /> : <VideoOff size={22} />}</button>
        <button className="call-btn end" onClick={() => leave(false)} disabled={!inCall}><Phone size={20} />Leave</button>
        <button className="call-btn end dark" onClick={() => leave(true)} disabled={!inCall}>End for everyone</button>
      </div>
    </div>
  )
}

function Overlay({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return <div className="call-overlay"><div className="box"><h2>{title}</h2>{text && <p>{text}</p>}{children}</div></div>
}

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message
  const reason = (e as { reason?: string; type?: string })?.reason ?? (e as Error)?.message
  if (typeof reason === 'string' && /permission|NotAllowed/i.test(reason)) return 'Allow camera and microphone access in your browser settings, then try again.'
  return reason ? `Couldn't start the call: ${reason}` : 'Couldn\'t start the call. Please try again.'
}

/** Camera/mic check before joining. Uses getUserMedia only for the preview; Zoom opens its own devices. */
function PreJoin({ title, subtitle, micOn, camOn, setMicOn, setCamOn, error, onJoin, onBack }: {
  title: string; subtitle: string; micOn: boolean; camOn: boolean
  setMicOn: (v: boolean) => void; setCamOn: (v: boolean) => void
  error: string | null; onJoin: () => void; onBack: () => void
}) {
  const [media, setMedia] = useState<MediaStream | null>(null)
  const [permission, setPermission] = useState<'checking' | 'ok' | 'denied' | 'unavailable'>('checking')
  // The <video> mounts after the stream arrives, so attach it from a callback ref.
  const attachPreview = useCallback((el: HTMLVideoElement | null) => { if (el && media) el.srcObject = media }, [media])

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false
    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setPermission('unavailable'); return }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        setMedia(stream)
        setPermission('ok')
      } catch (e) {
        setPermission((e as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'unavailable')
      }
    })()
    return () => { cancelled = true; stream?.getTracks().forEach((t) => t.stop()) }
  }, [])

  return (
    <div className="call">
      <div className="call-top"><button className="back" onClick={onBack} aria-label="Back to sessions"><ChevronLeft size={22} /></button></div>
      <div className="prejoin">
        <div className="preview">
          {permission === 'ok' && camOn
            ? <video ref={attachPreview} autoPlay muted playsInline />
            : <span>{permission === 'checking' ? 'Starting camera…' : camOn ? 'Camera unavailable' : 'Camera off'}</span>}
        </div>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          {permission === 'denied' && <div className="banner banner-error">Camera and microphone are blocked. Click the camera icon in the address bar to allow them, then reload.</div>}
          {permission === 'unavailable' && <div className="banner banner-error">We couldn't find a camera or microphone. You can still join and listen.</div>}
          {error && <div className="banner banner-error">{error}</div>}
          <div className="row" style={{ margin: '14px 0 18px' }}>
            <button className={`call-btn ${micOn ? '' : 'off'}`} onClick={() => setMicOn(!micOn)} aria-label={micOn ? 'Join muted' : 'Join with microphone on'} aria-pressed={!micOn}>{micOn ? <Mic size={22} /> : <MicOff size={22} />}</button>
            <button className={`call-btn ${camOn ? '' : 'off'}`} onClick={() => setCamOn(!camOn)} aria-label={camOn ? 'Join with camera off' : 'Join with camera on'} aria-pressed={!camOn}>{camOn ? <Video size={22} /> : <VideoOff size={22} />}</button>
          </div>
          <Button size="lg" onClick={onJoin} disabled={permission === 'checking'}><Video size={20} />Join session</Button>
          <p className="small" style={{ color: '#B9ADA5', marginTop: 14 }}>You join as host. Sessions are not recorded.</p>
        </div>
      </div>
    </div>
  )
}
