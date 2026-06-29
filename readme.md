# WatchTogether

A custom Discord Activity that allows everyone in a voice channel to watch the same video or live stream together.

WatchTogether is designed primarily for **HLS (.m3u8)** streams, while also supporting MP4 and WebM media. Every participant loads the stream directly from its original source; the application only synchronizes playback and shared controls.

> **Disclaimer**
> This project does **not** proxy, restream, or redistribute video content. Users are responsible for ensuring they have permission to view and share any stream they load. Support for third-party services (such as Twitch or YouTube) should use their official embedding mechanisms and comply with their terms of service.

---

## Features

- 🎥 Synchronized playback
- 📺 HLS (.m3u8) support
- 🎬 MP4/WebM support
- ⏯ Shared Play/Pause
- ⏩ Shared Seeking
- ⚡ Playback speed synchronization
- 👑 Host-controlled session
- 👥 Automatic room creation
- 🔄 Automatic host reassignment
- 📡 Live stream support
- 💻 Discord Activity integration
- 🌙 Discord-inspired dark UI
- 📱 Responsive layout
- 🔁 Automatic reconnection
- 📈 Playback drift correction
- 🔒 Server-authoritative synchronization

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- Discord Embedded App SDK
- hls.js
- Socket.IO Client

## Backend

- Node.js
- Express
- Socket.IO

## Shared

- TypeScript types
- Shared interfaces

---

# Project Structure

```
watchtogether/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── discord/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── player/
│   │   ├── services/
│   │   ├── socket/
│   │   ├── styles/
│   │   └── App.tsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── rooms/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── types/
│   │   └── server.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── shared/
│   └── types/
│
├── docker-compose.yml
├── Dockerfile
├── README.md
└── .env.example
```

---

# Requirements

- Node.js 20+
- npm 10+
- Discord Developer Account
- Discord Application configured as an Activity

---

# Installation

Clone the repository

```bash
git clone https://github.com/yourusername/watchtogether.git

cd watchtogether
```

Install dependencies

Frontend

```bash
cd frontend
npm install
```

Backend

```bash
cd ../backend
npm install
```

---

# Environment Variables

Backend

Create `.env`

```env
PORT=3001

CLIENT_URL=http://localhost:5173

SESSION_SECRET=change_me
```

Frontend

Create `.env`

```env
VITE_DISCORD_CLIENT_ID=YOUR_DISCORD_APPLICATION_ID

VITE_API_URL=http://localhost:3001
```

---

# Running

Backend

```bash
cd backend

npm run dev
```

Frontend

```bash
cd frontend

npm run dev
```

The frontend will run on

```
http://localhost:5173
```

The backend will run on

```
http://localhost:3001
```

---

# Building

Frontend

```bash
npm run build
```

Backend

```bash
npm run build
```

---

# Discord Activity Setup

## 1. Create an Application

Open the Discord Developer Portal.

Create a new application.

Example

```
WatchTogether
```

---

## 2. Enable Activities

Enable Embedded App support for the application.

---

## 3. Configure OAuth

Scopes

```
applications.commands

activities.write
```

Configure redirect URLs if needed.

---

## 4. Register Activity URL

During development

```
http://localhost:5173
```

Production example

```
https://watch.example.com
```

---

## 5. Invite the application

Invite it to your Discord server.

---

# Supported Media

## HLS

```
https://example.com/live/index.m3u8
```

Uses hls.js automatically.

---

## MP4

```
https://example.com/movie.mp4
```

Uses native HTML5 playback.

---

## WebM

```
https://example.com/movie.webm
```

Uses native HTML5 playback.

---

# Room Synchronization

Every Discord voice channel becomes its own synchronized room.

Room identifier

```
Discord Voice Channel ID
```

Each room stores

```ts
interface RoomState {
    streamUrl: string
    playing: boolean
    currentTime: number
    playbackRate: number
    hostId: string
    lastUpdated: number
}
```

---

# Socket Events

Client → Server

```
joinRoom

leaveRoom

play

pause

seek

changeStream

changePlaybackRate

transferHost

ping
```

Server → Client

```
syncState

roomUpdated

userJoined

userLeft

hostChanged

pong
```

---

# Host Permissions

Only the Host can

- Change stream
- Pause playback
- Resume playback
- Seek
- Change playback speed
- Transfer host ownership

If the Host disconnects

The server automatically promotes another participant.

---

# Synchronization

The backend is the source of truth.

Clients periodically compare playback position.

If playback drift exceeds the configured threshold

```
500 ms
```

Clients automatically seek to the synchronized position.

---

# Playback Flow

```
Host presses Play

        │

        ▼

Socket Event

        │

        ▼

Backend validates Host

        │

        ▼

Broadcast update

        │

        ▼

All clients play
```

---

# Security

- Validate every socket message
- Never trust client state
- Validate URLs
- Sanitize inputs
- Restrict privileged actions to Host
- Ignore unauthorized events
- Rate-limit socket messages
- Validate playback updates

---

# Deployment

## Frontend

Recommended

- Vercel
- Cloudflare Pages
- Netlify

---

## Backend

Recommended

- Railway
- Render
- Fly.io
- VPS

---

# Docker

Build

```bash
docker compose build
```

Run

```bash
docker compose up
```

---

# Future Improvements

- Playlist support
- Watch queue
- Stream history
- Password-protected rooms
- Emoji reactions
- Live chat
- Subtitles
- Multi-audio tracks
- Quality selector
- Picture-in-picture
- Mobile optimizations
- Analytics dashboard
- Moderation tools
- Invite links
- Room persistence
- Redis synchronization
- PostgreSQL persistence

---

# Contributing

Pull requests are welcome.

Please follow the project's coding standards and ensure all changes include appropriate tests where applicable.

---

# License

MIT License

---

# Acknowledgements

Built using

- React
- TypeScript
- Vite
- Express
- Socket.IO
- hls.js
- Discord Embedded App SDK
- TailwindCSS