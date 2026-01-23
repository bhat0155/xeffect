# XEffect

A minimal 21-day habit tracker with a public progress view and a private authenticated dashboard.

## Highlights
- Public landing page shows a read-only habit grid.
- Private dashboard for creating and tracking a single habit.
- Google OAuth login with JWT cookie auth.
- Streak engine with 21-day boxes and milestone messaging.

## Tech Stack
- Frontend: React, TypeScript, Tailwind CSS, DaisyUI
- Backend: Node.js, Express, TypeScript, Passport (Google OAuth)
- Database: Postgres (Prisma)
- Hosting: Vercel (frontend), Render (backend), Supabase (db)

## Repo Layout
```
backend/   # Express API + Prisma + tests
frontend/  # React app (Vite)
```

## Local Development
### 1) Backend
```
cd backend
npm install
```

Create `backend/.env` (see `backend/.env.example`), then:
```
npm run dev
```

### 2) Frontend
```
cd frontend
npm install
npm run dev
```

## Environment Variables
Backend (`backend/.env`):
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`
- `FRONTEND_APP_REDIRECT` (optional)
- `GOOGLE_CALLBACK_URL` (recommended for prod)
- `PUBLIC_HABIT_EMAIL` (optional)
- `OPEN_AI_API_KEY` (optional)
- `OPEN_AI_MODEL` (optional)

Frontend (Vercel or `frontend/.env.local`):
- `VITE_API_URL` (leave empty when using Vercel rewrites)

## Scripts (Backend)
- `npm run dev` - start API with nodemon
- `npm run build` - generate Prisma client + compile TS
- `npm run start` - run compiled server
- `npm test` - run tests

## Deployment Notes
- The frontend proxies `/api` and `/auth` through Vercel rewrites so cookies are same-origin.
- For production OAuth, set:
  - `GOOGLE_CALLBACK_URL=https://your-domain/auth/google/callback`
  - `FRONTEND_ORIGIN=https://your-domain`
  - `FRONTEND_APP_REDIRECT=https://your-domain/app`

## API Docs
- Swagger UI (local): `http://localhost:4000/docs`
- Swagger UI (prod): `https://xeffect.onrender.com/docs`

## License
MIT
