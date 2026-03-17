import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// ═══════════════════════════════════════
//  PASTE YOUR FIREBASE CONFIG HERE
// ═══════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyDWV6CBJ8sR5Mx0zCQb5eMHktb7xOzdEeo",
  authDomain: "threadchat-2222d.firebaseapp.com",
  projectId: "threadchat-2222d",
  databaseURL: "https://threadchat-2222d-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "threadchat-2222d.firebasestorage.app",
  messagingSenderId: "1057516156860",
  appId: "1:1057516156860:web:dfd4ad5889705d61ee1db9"
}

const app  = initializeApp(firebaseConfig)
export const auth    = getAuth(app)
export const db      = getDatabase(app)
export const storage = getStorage(app)
