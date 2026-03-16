import React, { useState } from 'react'
import { ref, set, get, update, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '../firebase'

async function hashStr(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function rnd(n = 10) { return Math.random().toString(36).slice(2, 2 + n) }

const css = {
  wrap: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', width: '100%', position: 'relative', overflow: 'hidden', display: 'flex' },
  gridBg: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--s1) 1px,transparent 1px),linear-gradient(90deg,var(--s1) 1px,transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%)', pointerEvents: 'none', opacity: 0.5 },
  glow: { position: 'absolute', width: 700, height: 700, background: 'radial-gradient(circle,rgba(255,255,255,0.028) 0%,transparent 65%)', top: '50%', left: '50%', transform: 'translate(-50%,-58%)', pointerEvents: 'none' },
  inner: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logo: { fontSize: 80, fontWeight: 800, letterSpacing: -6, lineHeight: 1, color: 'var(--text)', display: 'inline-block', animation: 'logoIn 0.7s cubic-bezier(0.22,1,0.36,1)' },
  dot: { display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', verticalAlign: 'super', marginLeft: 4, marginBottom: 8, transition: 'background 0.3s' },
  tag: { fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--dim)', marginTop: 10, marginBottom: 52, animation: 'fadeIn 1s ease 0.3s both' },
  card: { width: 390, background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(255,255,255,0.02),0 40px 80px rgba(0,0,0,0.7)', animation: 'cardIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both' },
  tabs: { display: 'flex', borderBottom: '1px solid var(--b1)' },
  tab: (on) => ({ flex: 1, padding: 15, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 500, letterSpacing: 2.5, textTransform: 'uppercase', color: on ? 'var(--text)' : 'var(--dim)', cursor: 'pointer', textAlign: 'center', borderBottom: on ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all 0.2s' }),
  body: { padding: 26 },
  label: { fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--dim)', marginBottom: 7, display: 'block' },
  input: { width: '100%', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10, padding: '13px 15px', fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 14, color: 'var(--text)', outline: 'none', marginBottom: 16, transition: 'border-color 0.2s', userSelect: 'text', WebkitUserSelect: 'text' },
  err: { fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#886655', letterSpacing: 0.5, minHeight: 18, marginBottom: 6 },
  btn: (disabled) => ({ width: '100%', padding: 14, background: disabled ? 'var(--b1)' : 'var(--accent)', color: disabled ? 'var(--dim)' : 'var(--bg)', border: 'none', borderRadius: 10, fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: 2, opacity: disabled ? 0.4 : 1 }),
  hint: { fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--dimmer)', letterSpacing: 1, textAlign: 'center', marginTop: 14, lineHeight: 1.7 },
}

function Field({ label, type = 'text', placeholder, value, onChange }) {
  return (
    <>
      <label style={css.label}>{label}</label>
      <input style={css.input} type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} autoComplete="off" />
    </>
  )
}

function NewRoom({ uid, onDone }) {
  const [name, setName] = useState('')
  const [uname, setUname] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!name.trim()) return setErr('↳ name required')
    if (uname.trim().length < 3) return setErr('↳ username min 3 chars')
    if (pass.length < 6) return setErr('↳ password min 6 chars')
    setErr(''); setLoading(true)
    try {
      const u = uname.trim().toLowerCase()
      const usnap = await get(ref(db, 'usernames/' + u))
      if (usnap.exists()) return setErr('↳ username taken')
      const roomId = 'r_' + rnd(14), token = rnd(22)
      const passHash = await hashStr(pass + u)
      await set(ref(db, 'rooms/' + roomId), { createdAt: Date.now(), host: { uid, name: name.trim(), username: u }, token, tokenUsed: false })
      await set(ref(db, 'usernames/' + u), { roomId, role: 'host', name: name.trim(), passHash, uid, createdAt: Date.now() })
      onDone({ myName: name.trim(), username: u, roomId, token, peer: '', peerUid: '', role: 'host' })
    } catch (e) { setErr('↳ ' + e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <Field label="Your name" placeholder="how should they call you" value={name} onChange={setName} />
      <Field label="Username" placeholder="pick a unique username" value={uname} onChange={setUname} />
      <Field label="Password" type="password" placeholder="min 6 characters" value={pass} onChange={setPass} />
      <div style={css.err}>{err}</div>
      <button style={css.btn(loading)} disabled={loading} onClick={submit}>{loading ? 'Creating...' : 'Create room →'}</button>
      <div style={css.hint}>save your username & password — you'll need them to log back in from any device</div>
    </>
  )
}

function SignBack({ uid, onDone }) {
  const [uname, setUname] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!uname.trim()) return setErr('↳ username required')
    if (!pass) return setErr('↳ password required')
    setErr(''); setLoading(true)
    try {
      const u = uname.trim().toLowerCase()
      const snap = await get(ref(db, 'usernames/' + u))
      if (!snap.exists()) return setErr('↳ username not found')
      const data = snap.val()
      const passHash = await hashStr(pass + u)
      if (passHash !== data.passHash) return setErr('↳ wrong password')
      const rsnap = await get(ref(db, 'rooms/' + data.roomId))
      let token = '', peer = '', peerUid = ''
      if (rsnap.exists()) {
        const room = rsnap.val()
        token = room.token || ''
        if (data.role === 'host' && room.guest) { peer = room.guest.name; peerUid = room.guest.uid }
        if (data.role === 'guest' && room.host)  { peer = room.host.name;  peerUid = room.host.uid  }
      }
      await update(ref(db, 'usernames/' + u), { uid })
      onDone({ myName: data.name, username: u, roomId: data.roomId, token, peer, peerUid, role: data.role })
    } catch (e) { setErr('↳ ' + e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <Field label="Username" placeholder="your username" value={uname} onChange={setUname} />
      <Field label="Password" type="password" placeholder="your password" value={pass} onChange={setPass} />
      <div style={css.err}>{err}</div>
      <button style={css.btn(loading)} disabled={loading} onClick={submit}>{loading ? 'Signing in...' : 'Sign in →'}</button>
    </>
  )
}

function JoinRoom({ uid, defaultCode, onDone }) {
  const [name, setName] = useState('')
  const [uname, setUname] = useState('')
  const [pass, setPass] = useState('')
  const [code, setCode] = useState(defaultCode || '')
  const [err, setErr] = useState(defaultCode ? '↳ invite detected — fill in your details' : '')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!name.trim()) return setErr('↳ name required')
    if (uname.trim().length < 3) return setErr('↳ username min 3 chars')
    if (pass.length < 6) return setErr('↳ password min 6 chars')
    if (!code.trim()) return setErr('↳ paste invite code')
    setErr(''); setLoading(true)
    try {
      const u = uname.trim().toLowerCase()
      const usnap = await get(ref(db, 'usernames/' + u))
      if (usnap.exists()) return setErr('↳ username taken')
      const token = code.includes('?i=') ? code.split('?i=')[1] : code.trim()
      const snap = await get(query(ref(db, 'rooms'), orderByChild('token'), equalTo(token)))
      if (!snap.exists()) return setErr('↳ invite not found')
      let roomId, roomData
      snap.forEach(ch => { roomId = ch.key; roomData = ch.val() })
      if (roomData.tokenUsed) return setErr('↳ invite already used')
      const passHash = await hashStr(pass + u)
      await update(ref(db, 'rooms/' + roomId), { tokenUsed: true, guest: { uid, name: name.trim(), username: u } })
      await set(ref(db, 'usernames/' + u), { roomId, role: 'guest', name: name.trim(), passHash, uid, createdAt: Date.now() })
      onDone({ myName: name.trim(), username: u, roomId, token, peer: roomData.host.name, peerUid: roomData.host.uid, role: 'guest' })
    } catch (e) { setErr('↳ ' + e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <Field label="Your name" placeholder="how should they call you" value={name} onChange={setName} />
      <Field label="Username" placeholder="pick a username" value={uname} onChange={setUname} />
      <Field label="Password" type="password" placeholder="min 6 characters" value={pass} onChange={setPass} />
      <Field label="Invite code" placeholder="paste invite link or token" value={code} onChange={setCode} />
      <div style={css.err}>{err}</div>
      <button style={css.btn(loading)} disabled={loading} onClick={submit}>{loading ? 'Joining...' : 'Join room →'}</button>
      <div style={css.hint}>save your username & password to return anytime</div>
    </>
  )
}

const TABS = ['new', 'back', 'join']
const LABELS = { new: 'New room', back: 'Sign back in', join: 'Join room' }

export default function Landing({ uid, inviteToken, onSignIn }) {
  const [tab, setTab] = useState(inviteToken ? 'join' : 'new')

  function handleDone(session) {
    localStorage.setItem('_thread_session', JSON.stringify(session))
    onSignIn(session)
  }

  return (
    <div style={css.wrap}>
      <div style={css.glow} />
      <div style={css.gridBg} />
      <div style={css.inner}>
        <div style={css.logo}>thread<span style={css.dot} /></div>
        <div style={css.tag}>private · invite-only · end-to-end</div>
        <div style={css.card}>
          <div style={css.tabs}>
            {TABS.map(t => (
              <div key={t} style={css.tab(tab === t)} onClick={() => setTab(t)}>{LABELS[t]}</div>
            ))}
          </div>
          <div style={css.body}>
            {tab === 'new'  && <NewRoom  uid={uid} onDone={handleDone} />}
            {tab === 'back' && <SignBack uid={uid} onDone={handleDone} />}
            {tab === 'join' && <JoinRoom uid={uid} defaultCode={inviteToken} onDone={handleDone} />}
          </div>
        </div>
      </div>
    </div>
  )
}
