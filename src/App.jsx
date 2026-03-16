import React, { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { usePrefs } from './hooks/usePrefs'
import Landing from './screens/Landing'
import Chat from './screens/Chat'

// Keyframe animations injected globally
const KEYFRAMES = `
@keyframes logoIn { from{opacity:0;filter:blur(10px);transform:scale(1.05)} to{opacity:1;filter:blur(0);transform:scale(1)} }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes cardIn { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
@keyframes bPop   { from{opacity:0;transform:scale(0.9) translateY(5px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes popIn  { from{opacity:0;transform:scale(0.9) translateY(-8px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes tdot   { 0%,60%,100%{opacity:.2;transform:scale(.7)} 30%{opacity:1;transform:scale(1)} }
`

export default function App() {
  const { uid, ready } = useAuth()
  const { prefs, setPref } = usePrefs()

  // Session: null = not logged in, object = logged in
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('_thread_session') || 'null') }
    catch { return null }
  })

  // Invite token from URL
  const inviteToken = new URLSearchParams(location.search).get('i')

  // If invite token in URL and not logged in, go to landing
  useEffect(() => {
    if (inviteToken && session) {
      // Already logged in but got an invite — ignore, stay in chat
    }
  }, [inviteToken, session])

  function handleSignIn(s) {
    setSession(s)
  }

  function handleSignOut() {
    localStorage.removeItem('_thread_session')
    setSession(null)
  }

  if (!ready) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 40, fontWeight: 800, letterSpacing: -3, color: 'var(--text)' }}>thread</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--dimmer)', letterSpacing: 3, textTransform: 'uppercase' }}>connecting...</div>
      </div>
    )
  }

  return (
    <>
      <style>{KEYFRAMES}</style>
      {session
        ? <Chat
            session={session}
            uid={uid}
            prefs={prefs}
            setPref={setPref}
            onSignOut={handleSignOut}
          />
        : <Landing
            uid={uid}
            inviteToken={inviteToken}
            onSignIn={handleSignIn}
          />
      }
    </>
  )
}
