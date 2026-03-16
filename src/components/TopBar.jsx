import React from 'react'

const s = {
  bar: { height: 60, paddingTop: 'env(safe-area-inset-top)', display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 16, gap: 12, borderBottom: '1px solid var(--b1)', background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(24px)', flexShrink: 0, position: 'relative' },
  back: { color: 'var(--dim)', cursor: 'pointer', fontSize: 22, lineHeight: 1, flexShrink: 0 },
  av: { width: 38, height: 38, borderRadius: 12, background: 'var(--s3)', border: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0, position: 'relative', textTransform: 'uppercase' },
  dot: (on) => ({ position: 'absolute', bottom: -2, right: -2, width: 11, height: 11, borderRadius: '50%', border: '2.5px solid var(--bg)', background: on ? '#4a4' : 'var(--s4)' }),
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: 700, letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sub: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--dim)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 },
  acts: { display: 'flex', gap: 2 },
  btn: { width: 34, height: 34, border: 'none', background: 'transparent', color: 'var(--dim)', cursor: 'pointer', fontSize: 17, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  line: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,var(--b2) 40%,var(--b2) 60%,transparent)' },
}

export default function TopBar({ peerName, peerOnline, onBack, onInvite, onSettings, onMenu }) {
  return (
    <div style={s.bar}>
      <span style={s.back} onClick={onBack}>←</span>
      <div style={s.av}>
        {peerName ? peerName[0].toUpperCase() : '?'}
        <div style={s.dot(peerOnline)} />
      </div>
      <div style={s.info}>
        <div style={s.name}>{peerName || '—'}</div>
        <div style={s.sub}>{peerOnline ? 'online' : 'last seen recently'}</div>
      </div>
      <div style={s.acts}>
        <button style={s.btn} onClick={onInvite}>⊕</button>
        <button style={s.btn} onClick={onSettings}>⚙</button>
        <button style={s.btn} onClick={onMenu}>⋯</button>
      </div>
      <div style={s.line} />
    </div>
  )
}
