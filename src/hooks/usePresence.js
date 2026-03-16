import { useState, useEffect } from 'react'
import { ref, onValue, set, onDisconnect, off } from 'firebase/database'
import { db } from '../firebase'

export function usePresence(roomId, myUid, myName) {
  const [peerOnline, setPeerOnline] = useState(false)

  useEffect(() => {
    if (!roomId || !myUid || !myName) return

    // Write own presence
    const myRef = ref(db, `rooms/${roomId}/presence/${myUid}`)
    set(myRef, { online: true, name: myName })
    onDisconnect(myRef).update({ online: false })

    // Watch all presence
    const presRef = ref(db, `rooms/${roomId}/presence`)
    const unsub = onValue(presRef, snap => {
      if (!snap.exists()) return
      const data = snap.val()
      const on = Object.entries(data).some(([uid, d]) => uid !== myUid && d.online === true)
      setPeerOnline(on)
    })

    return () => {
      off(presRef, 'value', unsub)
      set(myRef, { online: false, name: myName })
    }
  }, [roomId, myUid, myName])

  return peerOnline
}
