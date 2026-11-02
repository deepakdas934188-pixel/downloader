# 🚀 Deploying OmniStream to Render (Step-by-Step Guide)

This guide walks you through deploying **OmniStream** (Next.js Backend + Angular 19 PWA Frontend) on **[Render](https://render.com/)**.

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
   - **`omnistream-backend`** (Web Service, Node runtime, free tier)
     - Root Directory: `backend`
     - Build Command: `npm install && npm run setup-bin && npm run build`
     - Start Command: `npm run start`
   - **`omnistream-frontend`** (Static Site, free tier & unlimited bandwidth)
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
   - **Name**: `omnistream-backend` (or your choice)
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
6. Once deployed, copy your backend URL, for example:
   ```
   https://omnistream-backend.onrender.com
   ```

---

### Part B: Deploy the Frontend (Angular 19 Static Site)
1. In Render Dashboard, click **New +** -> **Static Site**.
2. Connect the same repository: `https://github.com/deepakdas934188-pixel/downloader.git`.
3. Set the following settings:
   - **Name**: `omnistream-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `./dist/app/browser`
4. Under **Redirects/Rewrites**:
   - **Rule 1 (Reverse Proxy API)**:
     - **Type**: `Rewrite`
     - **Source**: `/api/*`
     - **Destination**: `https://<YOUR-BACKEND-NAME>.onrender.com/api/*`
   - **Rule 2 (Single Page App Routing)**:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
5. Click **Create Static Site**.

---

## ⚙️ Connecting Frontend to Backend in the App

If you deployed the frontend and backend on separate domains without a proxy rewrite:
1. Open your deployed frontend URL (e.g., `https://omnistream-frontend.onrender.com`).
2. Click **API SETTINGS** in the top navigation bar (or the ⚙️ icon next to the engine status badge).
3. Paste your Render backend API URL:
   ```
   https://omnistream-backend.onrender.com/api
   ```
4. Click **SAVE & CONNECT →**.
5. The badge will instantly turn 🟢 **ENGINE READY**! Your setting is saved locally in your browser.

---

## 🐳 Option 3: Deploy via Docker (Single Container)

If you prefer running both Frontend and Backend in a single unified Docker container:
1. Go to [dashboard.render.com](https://dashboard.render.com/) -> **New +** -> **Web Service**.
2. Select **Docker** as runtime.
3. Render will automatically detect the root `Dockerfile`.
4. Click **Deploy**.

---

## 🔍 Verifying Deployment

Once deployed:
1. Visit `https://<your-backend-url>/api/health`.
   - Expected JSON response:
     ```json
     {
       "status": "ok",
       "ytdlp": { "ok": true, "version": "...", "path": "..." },
       "ffmpeg": { "ok": true, "path": "..." }
     }
     ```
2. Open your frontend site, paste any YouTube or social media link, and enjoy downloading and trimming!
