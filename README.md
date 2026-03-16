# Thread — React + Vite

Private invite-only chat. Built with React, Vite, and Firebase.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm run dev
```
Open http://localhost:5173

### 3. Deploy to GitHub Pages

1. Push this folder to a GitHub repo
2. Go to repo Settings → Pages → Source: **GitHub Actions**
3. Every push to `main` auto-deploys via `.github/workflows/deploy.yml`

> Make sure `vite.config.js` has `base: '/YOUR_REPO_NAME/'`

## Firebase config
Your config is already in `src/firebase.js`. If you need to change it, edit that file.

## Project structure
```
src/
├── App.jsx              — root router
├── firebase.js          — Firebase init
├── index.css            — global styles
├── main.jsx             — entry point
├── components/
│   ├── ChatBubble.jsx   — message bubble
│   ├── EmojiPicker.jsx  — reaction picker
│   ├── Menu.jsx         — overflow menu
│   ├── MessageInput.jsx — input bar + reply
│   ├── Settings.jsx     — settings panel
│   └── TopBar.jsx       — chat header
├── hooks/
│   ├── useAuth.js       — Firebase anonymous auth
│   ├── useMessages.js   — realtime message stream
│   ├── usePrefs.js      — settings persistence
│   ├── usePresence.js   — online/offline
│   ├── useSound.js      — ping sound
│   └── useTyping.js     — typing indicator
└── screens/
    ├── Chat.jsx         — main chat screen
    ├── Invite.jsx       — invite link screen
    └── Landing.jsx      — login / join screen
```
