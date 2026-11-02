# 🚀 Deploying SA Downloader to Render (Step-by-Step Guide)

This guide walks you through deploying **SA Downloader** (Next.js Backend + Angular 19 PWA Frontend) on **[Render](https://render.com/)**.

---

## ⚡ Option 1: 1-Click Render Blueprint (Recommended)

Render Blueprints use the included `render.yaml` file to deploy **both the Backend Web Service and Frontend Static Site simultaneously with 1 click**.

### Steps:
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. In the top-right corner, click **New +** and select **Blueprint**.
3. Connect your GitHub repository:
   ```
   https://github.com/deepakdas934188-pixel/downloader.git
   ```
4. Render will detect `render.yaml` and configure:
   - **`sadownloader-be`** (Web Service, Node runtime, free tier)
     - Root Directory: `backend`
     - Build Command: `npm install && npm run setup-bin && npm run build`
     - Start Command: `npm run start`
     - URL: `https://sadownloader-be.onrender.com`
   - **`sadownloader-fe`** (Static Site, free tier & unlimited CDN bandwidth)
     - Root Directory: `frontend`
     - Build Command: `npm install && npm run build`
     - Publish Directory: `./dist/app/browser`
5. Click **Apply Blueprint**.
6. Render will automatically build and deploy both services!

---

## 🛠️ Option 2: Deploying Manually on Render

If you prefer configuring the services individually in Render's dashboard:

### Part A: Deploy the Backend (Next.js API Web Service)
1. Go to [dashboard.render.com](https://dashboard.render.com/) -> **New +** -> **Web Service**.
2. Connect your repo `https://github.com/deepakdas934188-pixel/downloader.git`.
3. Set the following settings:
   - **Name**: `sadownloader-be`
   - **Region**: Oregon (or nearest)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run setup-bin && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`
4. In **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
5. Click **Create Web Service**.
6. Once deployed, your backend URL will be:
   ```
   https://sadownloader-be.onrender.com
   ```

---

### Part B: Deploy the Frontend (Angular 19 Static Site)
1. In Render Dashboard, click **New +** -> **Static Site**.
2. Connect the same repository: `https://github.com/deepakdas934188-pixel/downloader.git`.
3. Set the following settings:
   - **Name**: `sadownloader-fe`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `./dist/app/browser`
4. Under **Redirects/Rewrites**:
   - **Rule (Single Page App Routing)**:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
5. Click **Create Static Site**.

---

## ⚙️ Connecting Frontend to Backend in the App

The frontend automatically defaults to `https://sadownloader-be.onrender.com/api` when deployed on Render!

If you ever need to customize the backend URL:
1. Open your deployed frontend URL.
2. Click **API SETTINGS** in the top navigation bar (or the ⚙️ icon next to the engine status badge).
3. Paste your backend API URL:
   ```
   https://sadownloader-be.onrender.com/api
   ```
4. Click **SAVE & CONNECT →**.
5. The badge will instantly turn 🟢 **ENGINE READY**! Your setting is saved locally in your browser.

---

## 🔍 Verifying Deployment

Once deployed:
1. Visit `https://sadownloader-be.onrender.com/api/health`.
   - Expected JSON response:
     ```json
     {
       "status": "ok",
       "ytdlp": { "ok": true, "version": "...", "path": "..." },
       "ffmpeg": { "ok": true, "path": "..." }
     }
     ```
2. Open your frontend site, paste any YouTube or social media link, and enjoy downloading and trimming!
