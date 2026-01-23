# Deployment Guide (XEffect)

This guide describes a practical, **working** deployment for this repo:
- Frontend: **Vercel**
- Backend: **Render**
- Database: **Supabase Postgres**

It also includes a **future AWS roadmap** (Docker + CI/CD + App Runner) but keeps the immediate steps simple and reliable.

---

## 0) Preconditions
Make sure these are true before deploying:
- Secrets are **not committed** (`.env` is gitignored).
- You can run backend + frontend locally.
- Supabase project is created and reachable.

---

## 1) Database (Supabase)
1) Create a Supabase project.
2) Go to **Settings → Database** and copy the connection string.
3) Run migrations locally against Supabase:
```
cd backend
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
```
4) Confirm tables exist in Supabase.

**DoD**
- `User`, `Habit`, `HabitCheckin` tables exist in Supabase.

---

## 2) Backend on Render
1) Push the repo to GitHub.
2) Render → **New → Web Service**.
3) Select the repo.
4) Set:
   - **Root directory:** `backend`
   - **Build command:** `npm ci --include=dev && npm run build`
   - **Start command:** `npm run start`
5) Add env vars in Render:
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_ORIGIN=https://<your-vercel-domain>
FRONTEND_APP_REDIRECT=https://<your-vercel-domain>/app
GOOGLE_CALLBACK_URL=https://<your-vercel-domain>/auth/google/callback
PUBLIC_HABIT_EMAIL=your@email.com   # optional
OPEN_AI_API_KEY=...                 # optional
OPEN_AI_MODEL=gpt-4.1-mini          # optional
NODE_ENV=production
```
6) Deploy.

**DoD**
- `https://<render-domain>/health` returns 200.

---

## 3) Google OAuth Configuration
Google Cloud Console → OAuth 2.0 Client:

**Authorized JavaScript origins**
- `https://<your-vercel-domain>`

**Authorized redirect URIs**
- `https://<your-vercel-domain>/auth/google/callback`

**DoD**
- Login redirects back to Vercel and sets a cookie.

---

## 4) Frontend on Vercel
1) Vercel → **New Project** → Import repo.
2) Set **Root Directory** = `frontend`.
3) Build:
   - **Build command:** `npm run build`
   - **Output:** `dist`
4) Environment variables:
   - **Unset** `VITE_API_URL` (so frontend uses relative `/api`)
5) Make sure `vercel.json` is in repo root **and** `frontend/vercel.json`
   (in case Vercel root changes).
6) Deploy.

**DoD**
- `https://<vercel-domain>/public/ekam-xeffect` loads.
- `https://<vercel-domain>/auth/google` redirects to Google.

---

## 5) Vercel Rewrite (Required)
Your Vercel config should proxy API/auth to Render:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://<render-domain>/api/$1" },
    { "source": "/auth/(.*)", "destination": "https://<render-domain>/auth/$1" },
    { "source": "/docs/(.*)", "destination": "https://<render-domain>/docs/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Why:** This makes cookies same‑origin (works on Safari, Incognito, etc).

---

## 6) Final Smoke Test
1) Visit `/public/ekam-xeffect` (no login).
2) Click Login → Google OAuth.
3) Confirm redirect to `/app`.
4) `GET /api/habits/me` returns 200.
5) Create habit → save today → refresh.

---

# AWS Roadmap (Optional Next Phase)

This is optional and can be done after the above is stable.

## Phase A — Dockerize Backend
- Add `backend/Dockerfile`
- Add `backend/.dockerignore`
- Add `docker-compose.yml` (backend + postgres)

## Phase B — CI (GitHub Actions)
- Run typecheck + tests
- Build Docker image

## Phase C — CD (ECR + App Runner)
- Push Docker image to ECR
- App Runner deploys on new image

## Phase D — IaC (Terraform)
- ECR repo
- App Runner service
- IAM roles
- Route53 `api.<domain>`

---

## Common Issues
- **401 after login:** cookie not sent → ensure Vercel proxy + `GOOGLE_CALLBACK_URL` points to Vercel.
- **404 on refresh:** Vercel SPA rewrites missing.
- **Build fails on Render:** use `npm ci --include=dev`.

