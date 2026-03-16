import { useState, useEffect, useRef } from 'react'
import { ref, onChildAdded, onChildChanged, off } from 'firebase/database'
import { db } from '../firebase'

export function useMessages(roomId) {
  const [messages, setMessages] = useState([])
  const historyDoneRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!roomId) return
    setMessages([])
    historyDoneRef.current = false

    const msgsRef = ref(db, `rooms/${roomId}/msgs`)

    // child_added fires for all existing messages first, then new ones
    const addedUnsub = onChildAdded(msgsRef, snap => {
      const msg = { id: snap.key, ...snap.val(), isNew: historyDoneRef.current }
      setMessages(prev => {
        if (prev.find(m => m.id === snap.key)) return prev
        return [...prev, msg]
      })
      // Reset timer — after 400ms of silence, history is done
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        historyDoneRef.current = true
      }, 400)
    })

    // child_changed handles seen, reactions, deleted
    const changedUnsub = onChildChanged(msgsRef, snap => {
      const updated = { id: snap.key, ...snap.val() }
      setMessages(prev => prev.map(m => m.id === snap.key ? { ...m, ...updated } : m))
    })

    return () => {
      off(msgsRef, 'child_added', addedUnsub)
      off(msgsRef, 'child_changed', changedUnsub)
      clearTimeout(timerRef.current)
    }
  }, [roomId])

  return messages
}
