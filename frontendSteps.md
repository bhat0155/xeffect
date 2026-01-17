# frontend.md — XEffect Frontend Roadmap (Tailwind + DaisyUI)

## Decisions Locked In
- **UI**: Tailwind + DaisyUI
- **Routing rule for `/`**:
  - If **not logged in** → redirect to `/public/ekam-xeffect`
  - If **logged in** → redirect to `/app` (and `/app` loads from `GET /api/habits/me`)
- **Create habit UX**: Modal

---

## Critical sanity fixes (do these early)
These prevent “why is auth not working?” issues.

1) **CORS + cookies**
- Backend `cors({ origin: FRONTEND_ORIGIN, credentials: true })`
- Frontend fetch uses `credentials: "include"` for any endpoint that relies on cookies.

2) **OAuth redirect**
- Backend redirects to `FRONTEND_ORIGIN` after `/auth/google/callback`.
- Frontend handles post-redirect by calling `GET /api/habits/me`.

3) **Logout**
- Logout must be called from the browser (frontend) to clear browser cookie:
  - `POST /auth/logout` with `credentials: "include"`.

**DoD**
- Login → cookie appears in browser
- Logout from frontend → cookie disappears and `/api/habits/me` returns 401

---

## Phase 0 — Setup & Tooling (Day 1)

### Step 0.1 — Create project
**Action**
- Create React + TypeScript project (Vite recommended).
- Add Tailwind.
- Add DaisyUI plugin.

**DoD**
- App runs locally
- DaisyUI component classes render (verify with a styled button + card)

### Step 0.2 — Routing + env setup
**Action**
- Install React Router
- Add env var: `VITE_API_URL` (default `http://localhost:4000`)

**DoD**
- You can navigate between 2 routes without reload
- API base URL is configurable through env

### Step 0.3 — Folder structure
**Create**
- `src/pages`
- `src/components`
- `src/contexts`
- `src/lib`
- `src/types`

**DoD**
- Pages import components cleanly
- Types live in `src/types` (not scattered)

---

## Phase 1 — Routing & App Shell (Day 1)

### Step 1.1 — Define routes
**Routes**
- `/` (smart redirect page)
- `/login` (Google login CTA)
- `/app` (private dashboard)
- `/public/:slug` (public read-only)
- `/about`
- `*` (Not Found)

**DoD**
- All routes render
- Unknown route shows a 404 page

### Step 1.2 — Navbar + layout
**Navbar**
- Home, About
- Right side: Login/Logout button **placeholder UI only** (no logic yet)

**Home hero**
- Hero image
- Public slug text shown under hero (`ekam-xeffect`)

**DoD**
- Navbar renders on all pages
- Home/About navigation works
- Layout doesn’t jump between routes

### Step 1.3 — `/` smart redirect (minimal auth detection)
**Logic**
- On `/`, call `GET /api/habits/me` (with credentials)
  - If `200` → redirect `/app`
  - If `401` → redirect `/public/ekam-xeffect`
  - Else → show error page with “Retry”

**DoD**
- Visiting `/` always lands you on the correct page
- No infinite redirects

---

## Phase 2 — API Client + Typed Contracts (Day 2)

### Step 2.1 — Create API wrapper
**Rules**
- Always send cookies: `credentials: "include"`
- Normalize errors into `{ code, message }`
- Provide helpers:
  - `getMe()`
  - `getPublic(slug)`
  - `createHabit(name)`
  - `renameHabit(id, name)`
  - `saveToday(id)`
  - `logout()`

**DoD**
- `GET /health` works from browser
- `GET /api/habits/me` reliably differentiates `401` vs `200`

### Step 2.2 — Types
**Create types**
- `HabitBox` (day, status, canEdit)
- `Habit`
- `HabitState`
- `ApiError`

**DoD**
- Components do not use `any`
- API results are typed end-to-end

---

## Phase 3 — Auth State + Context (Day 2)

### Step 3.1 — AuthContext
**State**
- `isAuthed: boolean`
- `loading: boolean`
- `refreshAuth(): Promise<void>`

**Rules**
- `refreshAuth()` calls `GET /api/habits/me`
- If `200`, set authed
- If `401`, set not authed

**DoD**
- Refresh page keeps correct auth state (cookie-based)
- Navbar can react to auth state (Login vs Logout)

### Step 3.2 — Route protection
**Action**
- If user hits `/app` while not logged in:
  - redirect to `/public/ekam-xeffect`

**DoD**
- `/app` cannot show private UI while logged out

### Step 3.3 — Navbar Login/Logout wiring
**Login**
- Button navigates to `VITE_API_URL + /auth/google`

**Logout**
- Button calls `POST /auth/logout` with credentials
- Then calls `refreshAuth()` and redirects to `/public/ekam-xeffect`

**DoD**
- Login starts OAuth and returns to frontend
- Logout clears cookie (when triggered from browser)

---

## Phase 4 — Public Page (Read-Only) (Day 3)

### Step 4.1 — Build `/public/:slug`
**Action**
- Fetch `GET /api/public/:slug`
- Render:
  - title
  - streak metadata
  - 21-box grid (all non-editable)
  - CTA: “Create your own” → `/login`

**DoD**
- Public page loads without auth
- Boxes render and cannot be clicked

### Step 4.2 — Missing public habit behavior
Backend returns placeholder with `habit: null`.

**Action**
- Show empty chart + explanation + CTA

**DoD**
- No crash
- Clean empty state UX

---

## Phase 5 — Private Dashboard (`/app`) (Day 3)

### Step 5.1 — Load private habit state
**Action**
- On `/app`, call `GET /api/habits/me`
- Render:
  - `habit === null` → “Create habit” button → opens modal
  - `habit !== null` → grid + actions

**DoD**
- `/app` always shows correct state based on backend response
- Error handling is visible

### Step 5.2 — HabitGrid component
**Rules**
- Always render 21 boxes
- Styles:
  - done: filled
  - neutral: not done
  - editable: highlighted + clickable

**DoD**
- Exactly one editable box when allowed
- No editable boxes when `checkedInToday=true` or `allDone=true`

### Step 5.3 — Save Today action
**Action**
- Clicking editable box triggers `POST /api/habits/:id/save`
- Update UI from server response

**DoD**
- First click updates streak + grid
- Second click is safe (idempotent) and UI stays consistent

---

## Phase 6 — Create Habit Modal (DaisyUI) (Day 4)

### Step 6.1 — Modal behavior
**Action**
- Modal opens on `/app` when `habit === null`
- Contains:
  - input (max 60)
  - Create button
  - Cancel

**Rules**
- Client-side validate (1..60)
- On submit call `POST /api/habits`
- Close modal on success and refresh state

**DoD**
- Habit gets created and dashboard updates without refresh
- Validation errors show inside modal

---

## Phase 7 — Rename Habit (Day 4)

### Step 7.1 — Rename modal
**Action**
- “Rename” button opens modal
- Calls `PATCH /api/habits/:id`

**DoD**
- Name updates and persists after refresh

---

## Phase 8 — UX Polish + AI Milestone (Day 5)

### Step 8.1 — Loading states
**Action**
- Skeleton for grid + metadata on public and private pages

**DoD**
- No flashing or awkward layout shifts

### Step 8.2 — Error banners
**Action**
- Standard DaisyUI alert component for `{code,message}`

**DoD**
- Every failed request becomes visible to the user

### Step 8.3 — AI milestone display
**Action**
- If `ai` exists in state, show a milestone banner/card

**DoD**
- Shown only when present
- Looks clean and doesn’t disrupt layout

---

## Final Manual Test Checklist
- Visiting `/` redirects properly:
  - logged out → `/public/ekam-xeffect`
  - logged in → `/app`
- Public page loads and is read-only
- `/app` redirects if logged out
- Navbar Login triggers OAuth
- Navbar Logout clears cookie (from browser)
- Create habit modal works
- Save today works and is idempotent
- Rename works
- Refresh preserves auth state
- AI milestone displays (when returned)

---

## Suggested Commits
1. `chore(frontend): init vite react ts tailwind daisyui router`
2. `feat(frontend): app shell routes navbar home about`
3. `feat(frontend): api client + typed contracts`
4. `feat(frontend): auth context + smart redirects + navbar auth`
5. `feat(frontend): public page + read-only grid`
6. `feat(frontend): private dashboard + save today`
7. `feat(frontend): create habit modal + rename`
8. `feat(frontend): polish loading errors milestone`