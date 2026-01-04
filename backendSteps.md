# XEffect Backend Roadmap (Chronological)

This README section lists the backend build steps in order.

---

## 1) Backend Setup (Project + Tooling)

1. Create project folder + initialize git repo
2. `npm init -y`
3. Install runtime deps:
   - `express cors helmet cookie-parser passport passport-google-oauth20 jsonwebtoken dotenv prisma @prisma/client`
4. Install dev deps:
   - `typescript ts-node nodemon @types/node @types/express @types/cors @types/cookie-parser @types/jsonwebtoken @types/passport`
5. Create `tsconfig.json`
6. Add scripts in `package.json`: `dev`, `build`, `start`
7. Create folders:
   - `src/routes`
   - `src/middleware`
   - `src/services`
   - `src/utils`
   - `src/config`
8. Create `.env` and `.env.example`

---

## 2) Express Server (Base App)

9. Create `src/server.ts`
10. Add base middleware:
   - `helmet()`
   - `cors({ origin: FRONTEND_ORIGIN, credentials: true })`
   - `cookieParser()`
   - `express.json()`
11. Add `GET /health` route
12. Run server locally and confirm it starts

---

## 3) Database (Prisma + Postgres)

13. `npx prisma init`
14. Define Prisma models:
   - `User`
   - `Habit`
   - `HabitCheckin`
15. Add constraints:
   - unique `User.email`
   - unique `User.googleId`
   - unique `Habit.publicSlug`
   - unique `(habitId, checkinDate)` in `HabitCheckin`
16. Add relations + cascade delete:
   - deleting `Habit` deletes related `HabitCheckin` rows
17. Run migration:
   - `npx prisma migrate dev --name init`
18. Create Prisma client singleton:
   - `src/config/prisma.ts`

---

## 4) Authentication (Google OAuth + JWT Cookie)

19. Configure Passport Google strategy:
   - `src/config/passport.ts`
20. Create auth routes:
   - `GET /auth/google`
   - `GET /auth/google/callback`
21. In callback:
   - find/create user in DB
22. Generate signed JWT containing internal `userId`
23. Set JWT in httpOnly cookie + redirect to frontend
24. Create `requireAuth` middleware:
   - verify JWT from cookie
   - attach `req.userId`

---

## 5) Core Engine (UTC Day + State Builder)

25. Create UTC helpers:
   - `getTodayUTCDate()`
   - `getYesterdayUTCDate()`
26. Create “state engine” service:
   - fetch active habit for user
   - fetch recent checkins
   - compute `currentStreak`, `checkedInToday`, `allDone`
   - build `boxes[21]` → `{ day, status, canEdit }`
27. Define a single response shape (HabitState) to return to frontend

---

## 6) Private APIs (User Habit Flow)

28. `GET /api/habits/me`
   - return current habit state (or empty state if none)
29. `POST /api/habits`
   - delete existing habit + cascade checkins
   - create new habit
   - return state
30. `PATCH /api/habits/:id`
   - edit habit name
31. `POST /api/habits/:id/save`
   - if `allDone=true` → reject
   - insert today checkin if missing (no undo)
   - recompute streak
   - update `bestStreak`
   - if streak becomes 21 → set `allDone=true`
   - return state
32. Add ownership checks on all habit endpoints

---

## 7) Public API (Ekam Landing Page)

33. `GET /api/public/:publicSlug`
   - return read-only habit state (set `canEdit=false` for all boxes)

---

## 8) AI Milestones (Optional Layer)

34. Add Habit fields:
   - `lastMilestoneReached`
   - (optional) cached AI message fields
35. In save flow:
   - if streak hits 1/3/7/14/21 and not yet reached → call OpenAI
   - store `lastMilestoneReached`
   - return AI message in response

---

## 9) Hardening (Production Feel)

36. Add centralized error handler + consistent error codes
37. Add rate limiting (at least on `/save` + AI behavior)
38. Add basic logging (requests + errors)

---

## 10) Testing + Verification

39. Add minimal unit tests:
   - streak computation
   - missed-day reset behavior
   - completion (Day 21 → allDone)
40. Local smoke test:
   - login → create habit → save → refresh → verify state

---

## 11) Deployment (AWS)

41. Deploy Postgres (RDS) + run migrations
42. Deploy API (App Runner) with env vars/secrets
43. Production smoke test:
   - auth → create habit → save → public route