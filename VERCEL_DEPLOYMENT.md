# Crevio Vercel Deployment Guide

This repository is pre-configured for full-stack deployment on **Vercel** with:
- **Frontend**: Vite + React SPA (Static assets in `dist/`)
- **Backend API**: Express serverless function (`api/index.mjs` routing `/api/*`)
- **Database**: Neon Serverless PostgreSQL (`DATABASE_URL`)

---

## 🚀 Quick Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. Push your latest code to your GitHub / GitLab repository.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** -> **"Project"**.
3. Import your `Crevio` repository.
4. Keep the default build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add all required environment variables (see list below).
6. Click **Deploy**.

---

### Method 2: Deploy via Vercel CLI

```bash
# 1. Install Vercel CLI globally (if not already installed)
npm install -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy to preview / production
vercel --prod
```

---

## 🔑 Required Environment Variables

Set these in your **Vercel Project Settings -> Environment Variables**:

| Variable Name | Required | Example / Value | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require` | Neon Postgres connection string |
| `JWT_SECRET` | Yes | `your_production_jwt_secret_key` | Secret key for JWT signing |
| `CLERK_SECRET_KEY` | Yes | `sk_test_...` or `sk_live_...` | Clerk Backend Secret Key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | `pk_test_...` or `pk_live_...` | Clerk Frontend Publishable Key |
| `CLERK_PUBLISHABLE_KEY` | Yes | `pk_test_...` or `pk_live_...` | Clerk Publishable Key (server fallback) |
| `VITE_APP_NAME` | Optional | `Crevio` | App display name |
| `VITE_ENABLE_MOCK_DATA` | Optional | `false` | Set to `false` for live DB data |
| `VITE_CLOUDINARY_CLOUD_NAME` | Optional | `vobf6iec` | Cloudinary Cloud Name for uploads |
| `VITE_CLOUDINARY_API_KEY` | Optional | `784877527...` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Optional | `MU3gUF...` | Cloudinary API Secret |
| `OPENAI_API_KEY` | Optional | `sk-proj-...` | OpenAI Key for AI features |
| `INSTAGRAM_APP_ID` | Yes | `4248222828762658` | Meta / Instagram App ID |
| `INSTAGRAM_APP_SECRET` | Yes | `<your_app_secret>` | Meta / Instagram App Secret |
| `INSTAGRAM_REDIRECT_URI` | Yes | `https://crevio.co.in/api/auth/instagram/callback` | Meta OAuth Redirect URI for crevio.co.in |
| `FRONTEND_URL` | Yes | `https://crevio.co.in` | Production frontend domain |
| `STATE_JWT_SECRET` | Yes | `random_secret_string` | Secret for signing OAuth state tokens |
| `TOKEN_ENCRYPTION_KEY` | Yes | `32-byte hex string (64 chars)` | AES-256-GCM token encryption key |

> **Note**: `VITE_API_URL` is **not required** on Vercel because both frontend and API are hosted on domain `crevio.co.in`. The frontend automatically routes `/api/*` to the Vercel serverless Express function.


---

## 📂 Project Vercel Architecture

- **`vercel.json`**: Configures rewrites so `/api/*` goes to `api/index.mjs` (Express backend) and all other routes serve `index.html` (Vite SPA).
- **`api/index.mjs`**: Serverless function entry point exporting the Express application from `server/app.mjs`.
- **`server/app.mjs`**: Express routes & middleware setup.
- **`server/index.mjs`**: Standalone Express + Socket.IO server for local development (`npm run api:start` or `npm run dev:all`).
