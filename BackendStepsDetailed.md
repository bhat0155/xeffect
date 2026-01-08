# XEffect Backend Step-by-Step Guide (No Code) + Definition of Done (Postman)

This guide is **chronological**. Each step has a clear **Definition of Done (DoD)** you can verify with **Postman** (and a few with unit tests / Swagger / Docker).

---

## 0) Prerequisites (Before Step 1)
- Node.js installed
- Postman installed
- A PostgreSQL instance available (local Docker Postgres or local installation)
- Google Cloud OAuth credentials ready (Client ID/Secret + callback URL)
- (Optional later) OpenAI API key

**DoD**
- You can connect to Postgres using a GUI tool or `psql`
- You can run `node -v` and `npm -v`

---

## 1) Backend Setup (Project + Tooling)
1. Create repo folder + initialize git
2. Initialize Node project
3. Install runtime deps (Express, auth, Prisma client, security)
4. Install dev deps (TS, nodemon, types)
5. Create `tsconfig.json`
6. Add scripts: `dev`, `build`, `start`, plus Prisma scripts
7. Create folder structure:
   - `src/routes`
   - `src/middleware`
   - `src/services`
   - `src/utils`
   - `src/config`
8. Create `.env` and `.env.example`

**DoD**
- `npm run dev` starts without crashing (even if no routes yet)
- `.env.example` exists with placeholders for required env vars
- Project compiles (`npm run build`) without TypeScript errors

---

## 2) Express Server (Base App)
1. Create `src/server.ts` bootstrap
2. Add middleware in this order:
   - `helmet`
   - `cors` (with `credentials: true`)
   - `cookie-parser`
   - `express.json()`
3. Add `GET /health` route
4. Add centralized error handler placeholder (later we refine)
5. Start server locally

**DoD (Postman)**
- `GET http://localhost:<PORT>/health`
  - returns `200 OK`
  - returns JSON like `{ "ok": true }` (any simple payload is fine)

---

## 3) Database (Prisma + Postgres)
1. `npx prisma init`
2. Configure `DATABASE_URL` in `.env`
3. Define Prisma models:
   - `User`
   - `Habit`
   - `HabitCheckin`
4. Add constraints:
   - unique `User.email`
   - unique `User.googleId`
   - unique `Habit.publicSlug` (nullable)
   - unique `(habitId, checkinDate)` for checkins
5. Add relations:
   - `User -> Habit` (one active habit per user via unique `Habit.userId`)
   - `Habit -> HabitCheckin`
6. Add cascade delete:
   - deleting Habit deletes checkins
7. Run migration `npx prisma migrate dev --name init`
8. Create Prisma singleton `src/config/prisma.ts`

**DoD**
- `npx prisma studio` opens and shows the 3 tables
- You can create a row manually in Prisma Studio (optional)
- Migration folder exists in `prisma/migrations`

---

## 4) Authentication (Google OAuth + JWT Cookie)
### 4.1 Google OAuth via Passport
1. Configure Google OAuth strategy in `src/config/passport.ts`
2. Add routes:
   - `GET /auth/google` (redirects to Google)
   - `GET /auth/google/callback` (handles Google callback)
3. Callback flow:
   - exchange code (Passport)
   - find/create `User` in DB
   - sign JWT containing internal `userId`
   - set JWT in `httpOnly` cookie
   - redirect to frontend URL

### 4.2 Protecting APIs
4. Implement `requireAuth` middleware:
   - read cookie
   - verify JWT signature
   - attach `req.userId`
5. Add a test protected route: `GET /api/me` (temporary) that returns the authenticated user basics

**DoD (Postman)**
- (Manual browser step) Visit:
  - `GET http://localhost:<PORT>/auth/google`
  - complete Google login
- After callback, confirm cookie exists in browser (Application/Storage -> Cookies)
- In Postman:
  - Call `GET /api/me` with cookie attached (Postman cookie jar enabled)
  - Returns `200` with your user info (id/email/name)
- Calling `GET /api/me` without cookie returns `401`

---

## 5) Core Engine (UTC Day + HabitState Builder)
### 5.1 UTC helpers
1. Create utility:
   - `getTodayUTCDate()` → returns `YYYY-MM-DD`
   - `getYesterdayUTCDate()` → returns `YYYY-MM-DD`

### 5.2 HabitState response shape
2. Define one consistent response format (HabitState):
   - habit metadata
   - state metadata (todayUTC, checkedInToday, currentStreak, bestStreak, allDone)
   - `boxes[21]` with `{ day, status, canEdit }`

### 5.3 State engine service (single source of truth)
3. Build a service that:
   - fetches active habit for `userId`
   - fetches recent checkins for that habit
   - computes `checkedInToday`
   - computes `currentStreak` via anchor + backward counting (max 21)
   - builds 21 boxes:
     - `status = day <= currentStreak`
     - `canEdit = (checkedInToday=false && allDone=false && day == currentStreak+1)`
   - returns HabitState

**DoD (Postman + DB)**
- If no habit exists: calling the future `/api/habits/me` must return a valid “empty state” response (not crash)
- If habit exists with 0 checkins: Day 1 is editable
- If you insert checkin rows manually for consecutive UTC dates, the computed streak matches expectation

---

## 6) Private APIs (User Habit Flow)
> All these endpoints require `requireAuth`.

### 6.1 GET `/api/habits/me`
1. Route calls state engine for authenticated user
2. Returns HabitState (or empty state)

**DoD (Postman)**
- Without cookie → `401`
- With cookie → `200` with HabitState JSON
- If no habit → returns empty state (boxes exist, no crash)

---

### 6.2 POST `/api/habits` (Create/Reset)
1. Validate input: habit name required (trim, length limits)
2. Delete existing habit for that user (if any) → cascade deletes checkins
3. Create new habit row
4. (If this is Ekam’s public habit) set:
   - `isPublic=true`
   - `publicSlug="ekam-xeffect"`
5. Return HabitState for new habit (streak 0, Day 1 editable)

**DoD (Postman)**
- Create habit returns `200/201` with:
  - habit created
  - streak = 0
  - Day 1 `canEdit=true`
- Creating again deletes old habit + resets state (confirm old checkins are gone in DB)

---

### 6.3 PATCH `/api/habits/:id` (Rename)
1. Validate name
2. Ownership check:
   - habit.userId must match req.userId
3. Update habit name
4. Return updated HabitState (or updated habit)

**DoD (Postman)**
- Renaming with correct habit id → `200`
- Renaming someone else’s habit id → `403`
- Renaming with invalid payload → `400`

---

### 6.4 POST `/api/habits/:id/save` (Save Today, No Undo)
1. Ownership check
2. If `allDone=true` → reject (409 or 400 with code `HABIT_COMPLETED`)
3. Compute `todayUTC`
4. Insert checkin for (habitId, todayUTC) if missing
   - If already exists → treat as success (idempotent)
5. Recompute HabitState
6. Update `bestStreak` if `currentStreak > bestStreak`
7. If `currentStreak == 21` (after save) → set `allDone=true`
8. Return HabitState (and optional AI message later)

**DoD (Postman)**
- Save once today → streak increases appropriately
- Save again same day → does not create duplicate rows (DB uniqueness proves it)
- After saving today → response has `checkedInToday=true` and all `canEdit=false`
- If you set habit to `allDone=true` in DB and call save → request is rejected

---

## 7) Public API (Landing Page)
### GET `/api/public/:publicSlug`
1. Find habit by slug + ensure it’s public
2. Compute HabitState
3. Force read-only behavior:
   - set all `canEdit=false` in response

**DoD (Postman)**
- `GET /api/public/ekam-xeffect` returns `200` and boxes with all `canEdit=false`
- Invalid slug returns `404` (or a placeholder response if that’s your choice)

---

## 8) AI Milestones (Optional Layer)
1. Add Habit fields:
   - `lastMilestoneReached` (int, default 0)
   - (optional) `lastAiMessage`, `lastAiAt`
2. In `/save` flow:
   - detect if streak hits 1/3/7/14/21
   - only trigger if milestone > lastMilestoneReached
   - store `lastMilestoneReached`
   - return AI message in response

**DoD (Postman)**
- On milestone save, response includes `ai.message`
- Re-saving same day does NOT re-trigger milestone message

---

## 9) Hardening (Production Feel)
1. Centralized error handler:
   - consistent JSON error shape: `{ code, message }`
2. Rate limit:
   - `/api/habits/:id/save`
   - AI trigger calls
3. Logging:
   - request logs (method, path, status, duration)
4. Security:
   - cookie flags correct for dev vs prod
   - CORS origin restricted to your frontend

**DoD (Postman)**
- Errors always return same shape
- Rate limit triggers after repeated calls
- Logs show request lines for each call

---

## 10) Unit Tests (Streak Engine)
1. Use a test runner (Jest/Vitest)
2. Test the streak compute function with fixed inputs:
   - consecutive days → correct streak
   - missed day → streak resets
   - missed yesterday + checked today → streak = 1 (restart)
   - day 21 completion → allDone behavior (in service-level test or integration test)
3. Ensure tests run in CI later

**DoD**
- `npm test` passes
- At least 6–10 meaningful tests around streak rules
- Tests do not depend on real clock (use fixed “today” input)

---

## 11) Swagger Docs (OpenAPI)
1. Add Swagger generation for your routes
2. Document:
   - auth (cookie-based)
   - endpoints + request bodies + responses (HabitState)
   - error codes
3. Expose docs at `/docs` (or `/api-docs`)

**DoD (Postman / Browser)**
- Visiting `/docs` shows all endpoints
- You can see example responses for HabitState
- You can test “GET /api/habits/me” from Swagger UI after logging in (cookie present)

---

## 12) Docker + docker-compose (Local Dev)
1. Create Dockerfile for API
2. Create docker-compose with:
   - `api` service
   - `postgres` service
3. Ensure Prisma migrations can run against the container DB
4. Provide a one-command local start

**DoD**
- `docker compose up` starts Postgres + API
- API connects to Postgres container successfully
- You can run migrations and then hit `/health` via Postman

---

## 13) Final Postman Scenario Checklist (Before Frontend)
You are done when all these pass:

1. Public route returns Ekam habit state (read-only)
2. Login creates a user row
3. Create habit resets previous habit + checkins
4. `/api/habits/me` returns correct boxes and canEdit
5. Save today inserts checkin, updates streak, disables canEdit
6. Next UTC day (simulate by modifying “today” in test mode or by manual DB date injection) unlocks next box on refresh
7. Missed day resets streak to 0; next save starts at 1 again
8. Day 21 sets `allDone=true` and further saves are rejected
9. Unit tests for streak engine pass
10. Swagger docs list and describe all endpoints
11. Docker compose runs the stack locally

---

## Deployment (Later)
AWS comes after backend is stable locally:
- RDS Postgres
- App Runner
- Secrets/env
- Smoke test all endpoints in production