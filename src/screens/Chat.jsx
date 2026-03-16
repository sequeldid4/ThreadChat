import React, { useRef, useEffect, useState, useCallback } from 'react'
import { ref, push, update, remove, set } from 'firebase/database'
import { db, storage } from '../firebase'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { useMessages } from '../hooks/useMessages'
import { usePresence } from '../hooks/usePresence'
import { useTyping } from '../hooks/useTyping'
import { useSound } from '../hooks/useSound'
import TopBar from '../components/TopBar'
import ChatBubble from '../components/ChatBubble'
import MessageInput from '../components/MessageInput'
import EmojiPicker from '../components/EmojiPicker'
import Settings from '../components/Settings'
import Menu from '../components/Menu'
import Invite from './Invite'

export default function Chat({ session, uid, prefs, setPref, onSignOut }) {
  const { myName, roomId, token, peer: initPeer, peerUid: initPeerUid, role } = session
  const [peer, setPeer]           = useState(initPeer || '')
  const [peerUid, setPeerUid]     = useState(initPeerUid || '')
  const [replyTo, setReplyTo]     = useState(null)
  const [picker, setPicker]       = useState(null) // { msgId, position }
  const [lightbox, setLightbox]   = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showMenu, setShowMenu]   = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)

  const messages  = useMessages(roomId)
  const peerOnline = usePresence(roomId, uid, myName)
  const { peerTyping, notifyTyping, stopTyping } = useTyping(roomId, uid)
  const ping = useSound(prefs.msgSound)
  const wrapRef = useRef(null)
  const prevMsgCount = useRef(0)

  // Detect peer from room if not already set
  useEffect(() => {
    if (peer) return
    const { ref: dbRef, onValue, off } = require('firebase/database')
    // Use dynamic import workaround — actually just use the already-imported ref/onValue
  }, [peer])

  // Play sound for new incoming messages
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      const newMsgs = messages.slice(prevMsgCount.current)
      newMsgs.forEach(m => {
        if (m.isNew && m.senderUid !== uid) {
          ping()
          if (prefs.notifs && !document.hasFocus() && Notification.permission === 'granted') {
            new Notification(peer || 'Thread', { body: m.imageUrl ? '📷 Image' : m.text })
          }
        }
      })
    }
    prevMsgCount.current = messages.length
  }, [messages])

  // Auto scroll to bottom on new messages
  useEffect(() => {
    const w = wrapRef.current
    if (!w) return
    const atBottom = w.scrollHeight - w.scrollTop - w.clientHeight < 100
    if (atBottom) w.scrollTop = w.scrollHeight
  }, [messages, peerTyping])

  // Mark peer messages as seen
  useEffect(() => {
    if (!peerUid || !prefs.readReceipts) return
    messages.filter(m => m.senderUid === peerUid && !m.seen).forEach(m => {
      update(ref(db, `rooms/${roomId}/msgs/${m.id}`), { seen: true })
    })
  }, [messages, peerUid, prefs.readReceipts])

  async function sendMsg(text) {
    stopTyping()
    const now = new Date()
    const payload = {
      senderUid: uid, senderName: myName,
      text, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ts: Date.now(), seen: false,
    }
    if (replyTo) payload.replyTo = { fbKey: replyTo.id, text: replyTo.text || '', senderName: replyTo.senderName }
    setReplyTo(null)
    await push(ref(db, `rooms/${roomId}/msgs`), payload)
  }

  async function uploadImage(file) {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return
    const sRef = storageRef(storage, `rooms/${roomId}/${Date.now()}_${file.name}`)
    const task = uploadBytesResumable(sRef, file)
    task.on('state_changed',
      s => setUploadPct(Math.round(s.bytesTransferred / s.totalBytes * 100)),
      () => setUploadPct(0),
      async () => {
        setUploadPct(0)
        const url = await getDownloadURL(task.snapshot.ref)
        const now = new Date()
        await push(ref(db, `rooms/${roomId}/msgs`), {
          senderUid: uid, senderName: myName, imageUrl: url, text: '',
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ts: Date.now(), seen: false,
        })
      }
    )
  }

  async function addReaction(msgId, emoji) {
    const path = `rooms/${roomId}/msgs/${msgId}/reactions/${uid}`
    const snap = await import('firebase/database').then(({ get, ref: r }) => get(r(db, path)))
    if (snap.val() === emoji) await set(ref(db, path), null)
    else await set(ref(db, path), emoji)
    setPicker(null)
  }

  async function deleteMsg(msgId) {
    await update(ref(db, `rooms/${roomId}/msgs/${msgId}`), { deleted: true, text: 'message deleted' })
  }

  async function clearAll() {
    await remove(ref(db, `rooms/${roomId}/msgs`))
  }

  // Group messages: figure out same-sender chains
  let lastSender = null
  const grouped = messages.map((m, i) => {
    const same = m.senderUid === lastSender
    lastSender = m.senderUid
    const nextSame = messages[i + 1]?.senderUid === m.senderUid
    return { ...m, same, nextSame }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', height: '100dvh', width: '100%', maxWidth: 740, margin: '0 auto' }}>

      <TopBar
        peerName={peer || '—'}
        peerOnline={peerOnline}
        onBack={onSignOut}
        onInvite={() => setShowInvite(true)}
        onSettings={() => setShowSettings(true)}
        onMenu={() => setShowMenu(true)}
      />

      {/* Messages */}
      <div ref={wrapRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 16px', display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' }}>

        {/* Scanlines */}
        <div style={{ content: '', position: 'fixed', inset: '60px 0 72px', background: 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,255,255,0.008) 28px,rgba(255,255,255,0.008) 29px)', pointerEvents: 'none', zIndex: 0 }} />

        {messages.length === 0 && (
          <div style={{ alignSelf: 'center', fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'var(--dim)', letterSpacing: 1.5, textTransform: 'uppercase', padding: '5px 16px', border: '1px solid var(--b1)', borderRadius: 100, margin: '10px 0', background: 'rgba(14,14,14,0.8)' }}>
            {peer ? `🔒 ${peer} joined · encrypted` : 'waiting for contact...'}
          </div>
        )}

        {grouped.map(m => (
          <div key={m.id} id={'row_' + m.id} style={{ marginTop: m.same ? 1 : 14 }}>
            <ChatBubble
              msg={m}
              isYou={m.senderUid === uid}
              showAvatar={!m.same}
              showName={!m.same}
              onReply={setReplyTo}
              onReact={(msgId, el) => {
                const rect = el?.getBoundingClientRect()
                setPicker({ msgId, position: rect ? { bottom: window.innerHeight - rect.top + 8, left: rect.left - 40 } : null })
              }}
              onDelete={deleteMsg}
              onImageClick={setLightbox}
            />
          </div>
        ))}

        {/* Typing indicator */}
        {peerTyping && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 4, zIndex: 1 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--s3)', border: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {peer?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 16, borderBottomLeftRadius: 4, padding: '13px 18px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 200, 400].map(d => (
                <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--b2)', animation: `tdot 1.3s ease ${d}ms infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload progress bar */}
      {uploadPct > 0 && (
        <div style={{ height: 2, background: 'var(--b1)' }}>
          <div style={{ height: '100%', background: 'var(--accent)', width: uploadPct + '%', transition: 'width 0.3s', borderRadius: 2 }} />
        </div>
      )}

      <MessageInput
        onSend={sendMsg}
        onTyping={notifyTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onImageUpload={uploadImage}
        enterSend={prefs.enterSend}
      />

      {/* Emoji picker */}
      {picker && (
        <EmojiPicker
          position={picker.position}
          onPick={emoji => addReaction(picker.msgId, emoji)}
          onClose={() => setPicker(null)}
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={lightbox} style={{ maxWidth: '92vw', maxHeight: '92vh', borderRadius: 12, animation: 'bPop 0.2s ease' }} alt="" />
        </div>
      )}

      {/* Overlays */}
      {showSettings && <Settings prefs={prefs} setPref={setPref} onClose={() => setShowSettings(false)} />}
      {showMenu && (
        <Menu
          onInvite={() => { setShowInvite(true); setShowMenu(false) }}
          onSettings={() => { setShowSettings(true); setShowMenu(false) }}
          onClear={() => { clearAll(); setShowMenu(false) }}
          onSignOut={onSignOut}
          onClose={() => setShowMenu(false)}
        />
      )}
      {showInvite && <Invite token={token} onBack={() => setShowInvite(false)} />}
    </div>
  )
}
