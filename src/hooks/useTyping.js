import { useState, useEffect, useRef } from 'react'
import { ref, onValue, set, off } from 'firebase/database'
import { db } from '../firebase'

export function useTyping(roomId, myUid) {
  const [peerTyping, setPeerTyping] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!roomId || !myUid) return
    const typRef = ref(db, `rooms/${roomId}/typing`)
    const unsub = onValue(typRef, snap => {
      if (!snap.exists()) { setPeerTyping(false); return }
      const data = snap.val()
      setPeerTyping(Object.entries(data).some(([uid, v]) => uid !== myUid && v === true))
    })
    return () => off(typRef, 'value', unsub)
  }, [roomId, myUid])

  function notifyTyping() {
    if (!roomId || !myUid) return
    set(ref(db, `rooms/${roomId}/typing/${myUid}`), true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      set(ref(db, `rooms/${roomId}/typing/${myUid}`), false)
    }, 2500)
  }

  function stopTyping() {
    clearTimeout(timerRef.current)
    if (roomId && myUid) set(ref(db, `rooms/${roomId}/typing/${myUid}`), false)
  }

  return { peerTyping, notifyTyping, stopTyping }
}
