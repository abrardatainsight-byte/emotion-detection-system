# Lumora — Cloud Deployment Guide
## After this guide, the system lives entirely in the cloud — just share two URLs.

---

## Overview

| Service | Platform | Cost | URL format |
|---|---|---|---|
| Backend (FastAPI + ViT) | Render | $7/mo (Starter plan) | `https://lumora-backend.onrender.com` |
| Frontend (React) | Vercel | Free | `https://lumora-xxxx.vercel.app` |

---

## Step 1 — Push your code to GitHub

```bash
# From the project root (emotion-detection-system/)
git init
git add .
git commit -m "Lumora v2 — 9-emotion dashboard"
git remote add origin https://github.com/YOUR_USERNAME/lumora.git
git push -u origin main
```

---

## Step 2 — Deploy the Backend to Render

1. Go to <https://dashboard.render.com> → **New → Blueprint**
2. Connect your GitHub repo
3. Render will detect `render.yaml` automatically
4. Click **Apply** — it will create the `lumora-backend` web service
5. Under the service → **Environment** tab, set:
   - `ALLOWED_ORIGINS` = *(leave as `*` for now — update in Step 4)*
6. First deploy takes **8–12 minutes** (PyTorch + model download ~340 MB)
7. Once "Live", test it:
   ```bash
   curl https://lumora-backend.onrender.com/health
   # → {"status":"ok","model":"dima806/facial_emotions_image_detection"}
   ```
8. **Copy your backend URL** — you'll need it in the next step

---

## Step 3 — Deploy the Frontend to Vercel

1. Go to <https://vercel.com> → **Add New Project** → import your GitHub repo
2. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite *(auto-detected)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add **Environment Variable**:
   - Key: `VITE_API_URL`
   - Value: `https://lumora-backend.onrender.com` *(your Render URL from Step 2)*
4. Click **Deploy** — takes ~1 minute
5. **Copy your Vercel URL** (e.g. `https://lumora-abc.vercel.app`)

---

## Step 4 — Wire CORS (connect the two services)

1. Back on Render → your backend service → **Environment** tab
2. Change `ALLOWED_ORIGINS` from `*` to your Vercel URL:
   ```
   https://lumora-abc.vercel.app
   ```
3. **Save** → Render auto-redeploys (takes ~2 minutes, no model re-download)

---

## Step 5 — Verify end-to-end in the cloud

1. Open `https://lumora-abc.vercel.app` in your browser
2. Register as Employee, register as HR (two incognito windows)
3. Employee portal shows "Monitoring active"
4. HR runs analysis → Insight Hub populates
5. Macro Analytics → all 4 charts fill in after a few captures
6. Correlation matrix appears in Macro Analytics

---

## What your client receives

Share these two links:

- **Employee**: `https://lumora-abc.vercel.app/employee/login`
- **HR Dashboard**: `https://lumora-abc.vercel.app/hr/login`

That's it — no install, no Python, no terminal. Just links.

---

## Environment Variables Reference

### Backend (Render)

| Variable | Required | Value |
|---|---|---|
| `ALLOWED_ORIGINS` | Yes | Your Vercel URL |
| `DATABASE_URL` | Optional | Postgres URL (leave unset for SQLite) |
| `EMOTION_MODEL_NAME` | Optional | `dima806/facial_emotions_image_detection` |

### Frontend (Vercel)

| Variable | Required | Value |
|---|---|---|
| `VITE_API_URL` | Yes | Your Render backend URL |

---

## Troubleshooting

**Backend shows "Service Unavailable" after deploy**
→ First deploy is slow (model download). Wait 10 minutes and retry `/health`.

**Frontend shows "Could not reach the server"**
→ `VITE_API_URL` is wrong or empty. Check Vercel → Settings → Environment Variables → redeploy.

**CORS error in browser console**
→ `ALLOWED_ORIGINS` on Render doesn't include your Vercel URL. Update it and redeploy.

**Charts empty after captures**
→ Render's free tier spins down after 15 minutes of inactivity. The Starter plan ($7) keeps it warm. If using free tier, the first request after idle takes ~30s to wake up.

**Model takes 8 minutes to load on first deploy**
→ Normal. PyTorch + model weights = ~340 MB download. Render caches it — redeploys are fast.
