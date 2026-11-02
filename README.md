# ⚡ OmniStream - Universal Media, Stream & Audio Downloader PWA

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-19.x-red.svg)](https://angular.dev/)
[![Ionic](https://img.shields.io/badge/Ionic-7.x-sky.svg)](https://ionicframework.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black.svg)](https://nextjs.org/)
[![yt--dlp](https://img.shields.io/badge/Engine-yt--dlp-green.svg)](https://github.com/yt-dlp/yt-dlp)
[![FFmpeg](https://img.shields.io/badge/Processing-FFmpeg-orange.svg)](https://ffmpeg.org/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

A high-performance, **Progressive Web App (PWA)** for downloading, trimming, and converting media from **all major social media platforms and live streams** directly to your device with **zero database required**.

Styled in an eye-catching **Neo-Brutalist / Memphis Design** aesthetic with bold typography, dot-matrix grid backgrounds, high-contrast borders, tactile drop shadows, and an interactive **live video dual-handle visual trimmer**.

---

## 🌟 Key Features

1. **Universal Social Media & Streaming Support**
   - Download videos and audio from **YouTube, Instagram (Reels, Stories, Posts), TikTok, Twitter / X, Facebook, Reddit, Pinterest, Twitch, Vimeo, and 1000+ sites**.
   - Dynamic platform detection with auto-updating badges and 1-click clipboard paste.

2. **Interactive Live Video Preview & Dual-Handle Trimmer**
   - Live embedded video viewport with synchronized scrubber.
   - Dual-handle visual range trimmer:
     - 🟢 **OPEN (Start)** handle
     - 🔴 **CLOSE (End)** handle
   - Quick segment tools: **Set Open (Now)**, **Set Close (Now)**, **Preview Clip**, and **Reset Full**.
   - Direct segment downloading via native FFmpeg keyframe-accurate cuts (`--download-sections` & `-ss / -to`).

3. **Private Account & Members-Only Link Support**
   - Dedicated **🔐 Private Post Auth** panel.
   - Enter your private profile session cookie (e.g., Instagram `sessionid` or Netscape format `cookies.txt`).
   - Cookies are passed directly to your local extraction process and **never stored anywhere**.

4. **Live Video & Stream Capture**
   - Native support for ongoing live broadcasts (YouTube Live, Twitch Streams, HLS `.m3u8`, RTMP).
   - "🔴 Live Stream" capture flag.

5. **Quality & Format Changer (FFmpeg Processing)**
   - **Video Formats**: MP4 (H.264 Universal), MKV (Lossless Matroska), WebM (VP9/Opus).
   - **Resolutions**: Best Available, 4K (2160p), 2K (1440p), 1080p FHD, 720p HD, 480p, 360p.
   - Automatically merges separate high-resolution DASH video and audio streams via embedded FFmpeg.

6. **🎵 Dedicated "Audio Only" Extraction**
   - 1-click audio mode for extracting songs, podcasts, and speeches.
   - **Audio Formats**: MP3, M4A (AAC), FLAC (Hi-Res Lossless), WAV (Uncompressed), OGG Vorbis.
   - **Bitrate Selector**: 320 kbps (Studio Master), 256 kbps (High Fidelity), 192 kbps (Standard HQ), 128 kbps (Compact).

7. **📁 Device Folder Management (Direct Local Saving)**
   - Utilizes the modern **File System Access API** (`showDirectoryPicker`).
   - Create or choose a specific directory on your local device (e.g., `Downloads/SocialVideos` or `D:/Clips/Audio`).
   - Categorized device subfolders (e.g. `OmniDownloads`, `Videos`, `Audio`, `Trimmed`).
   - Seamless fallback to standard browser download prompt for non-supported browsers.

8. **Zero Database Required (100% Stateless & Private)**
   - No external database server, SQL, or cloud storage required.
   - Local download history is kept securely in your browser's `localStorage`.

9. **Installable Progressive Web App (PWA)**
   - Includes Web App Manifest (`manifest.webmanifest`) and service worker (`sw.js`).
   - Installable on Desktop (Chrome / Edge) and Mobile (Android / iOS).

---

## 🛠️ Toolstack

- **Frontend**:
  - [Angular 19](https://angular.dev/) (Standalone Components, Reactive Architecture)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Ionic Framework](https://ionicframework.com/) (`@ionic/angular`)
  - Modern Web APIs (File System Access API, Clipboard API, Service Worker PWA)
  - Memphis / Neo-Brutalist SCSS Design System

- **Backend**:
  - [Next.js 14](https://nextjs.org/) (App Router & Route Handlers)
  - [yt-dlp](https://github.com/yt-dlp/yt-dlp) (Self-contained binary engine)
  - [FFmpeg](https://ffmpeg.org/) (via `@ffmpeg-installer/ffmpeg` and `@ffprobe-installer/ffprobe`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.17.0 or later)
- [npm](https://www.npmjs.com/)

### 2. Installation & Setup

Clone the repository:
```bash
git clone https://github.com/deepakdas934188-pixel/downloader.git
cd downloader
```

Install dependencies for root, backend, and frontend:
```bash
# Install backend dependencies
cd backend
npm install
npm run setup-bin

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 3. Running Concurrently (1-Click)

From the project root:
```bash
npm start
# OR double-click start.bat on Windows
```

This starts:
- **Next.js Backend API**: `http://localhost:3001`
- **Angular + Ionic Frontend**: `http://localhost:4200`

---

## ☁️ Deploy to Render (1-Click Blueprint)

Deploy both the backend engine and the frontend PWA to **[Render](https://render.com/)** in seconds:

1. Go to your [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Blueprint**.
2. Connect your repo: `https://github.com/deepakdas934188-pixel/downloader.git`.
3. Render automatically parses `render.yaml` and provisions:
   - ⚡ **Backend Web Service**: Node 20 runtime with `yt-dlp` and `ffmpeg` engine.
   - 🎨 **Frontend Static Site**: Angular 19 PWA with automatic API proxy rewrites.
4. Click **Apply Blueprint**!

👉 For detailed manual setup, Docker instructions, and troubleshooting, read the **[Render Deployment Guide](RENDER_DEPLOYMENT.md)**.

---

## 📂 Project Architecture

```
downloader/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts       # Verifies yt-dlp & FFmpeg status
│   │   │   ├── info/route.ts         # Extracts title, formats, duration, thumbnail
│   │   │   └── download/route.ts     # Streams media with FFmpeg trim/mux/cookies
│   │   ├── page.tsx                  # Backend health dashboard
│   │   └── layout.tsx
│   ├── bin/
│   │   └── .gitkeep                  # yt-dlp & ffmpeg binaries directory
│   ├── lib/
│   │   ├── binaries.ts               # Binary path resolver
│   │   ├── extractor.ts              # Media metadata extractor
│   │   ├── downloader.ts             # Download & transcode processor
│   │   └── types.ts                  # Shared TypeScript interfaces
│   ├── scripts/
│   │   └── setup-bin.js              # Auto-downloads yt-dlp & configures ffmpeg
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/
│   │   │   │   ├── downloader.service.ts   # Backend API communication & progress
│   │   │   │   ├── file-system.service.ts  # Direct device folder writing API
│   │   │   │   └── pwa.service.ts          # PWA install prompt manager
│   │   │   ├── app.component.ts            # Main application controller & trimmer logic
│   │   │   ├── app.component.html          # Neo-Brutalist layout & trimmer UI
│   │   │   └── app.component.scss          # Memphis design styling & badges
│   │   ├── index.html                      # PWA meta tags & Google fonts
│   │   ├── styles.scss                     # Global styles
│   │   └── main.ts
│   ├── public/
│   │   ├── manifest.webmanifest            # PWA manifest
│   │   └── sw.js                           # PWA service worker
│   ├── package.json
│   ├── angular.json
│   └── tsconfig.json
├── run-all.js                               # Dual-server concurrent runner
├── start.bat                                # Windows 1-click batch launcher
├── package.json                             # Monorepo workspace scripts
├── .gitignore                               # Git ignore configuration
└── README.md
```

---

## 🔐 How Private Account Downloading Works

1. Open your browser where you are logged into the private account (e.g., Instagram, Twitter).
2. Open DevTools (`F12`) -> **Application** / **Storage** -> **Cookies**.
3. Copy your session cookie (for Instagram, copy `sessionid=...`).
4. In OmniStream, click **"🔐 Private Post Auth"** and paste the cookie.
5. Paste the link of the private post and click **Fetch Info** & **Download**.
6. The session cookie is forwarded securely through your local process and never saved to any database.

---

## 📄 License

MIT License. Open-source and free to use.
