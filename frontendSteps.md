# frontend.md — XEffect Frontend Roadmap (Tailwind + DaisyUI)

## Decisions Locked In
- **UI**: Tailwind + DaisyUI
- **Routing rule for `/`**:
  - If **not logged in** → redirect to `/public/ekam-xeffect`
  - If **logged in** → redirect to `/app` (and `/app` loads from `GET /api/habits/me`)
- **Create habit UX**: Modal

---

## Phase 0 — Setup & Tooling

### Step 0.1 — Create project
**Action**
- Create React + TypeScript project (Vite recommended).
- Add Tailwind.
- Add DaisyUI plugin.

**DoD**
- App runs locally
- DaisyUI component classes render (verify with a styled button + card)

---

### Step 0.2 — Add routing + env setup
**Action**
- Install React Router
- Add env var: `VITE_API_URL` (default `http://localhost:4000`)

**DoD**
- You can navigate between 2 routes without reload
- API base URL is configurable through env

---

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

## Phase 1 — Routing & Redirect Logic

### Step 1.1 — Define routes
**Routes**
- `/` (smart redirect page)
- `/login` (Google login CTA)
- `/app` (private dashboard)
- `/public/:slug` (public read-only)
- `*` (Not Found)

**DoD**
- All routes render
- Unknown route shows a 404 page

---

### Step 1.2 — Implement `/` smart redirect
**Logic**
- On `/`, call `GET /api/habits/me`
  - If `200` → redirect to `/app`
  - If `401` → redirect to `/public/ekam-xeffect`
  - If other errors → show an error page with retry

**DoD**
- Visiting `http://localhost:3000/` reliably routes you to the correct page
- No infinite redirects

---

## Phase 2 — API Client + Typed Contracts

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

**DoD**
- `GET /health` works from browser
- `GET /api/habits/me` properly detects `401` vs `200`

---

### Step 2.2 — Types
**Create types**
- `HabitBox` (day, status, canEdit)
- `Habit`
- `HabitState`
- `ApiError`

**DoD**
- Components do not use `any`
- You can type-check the API results end-to-end

---

## Phase 3 — Auth State (Cookie-Based)

### Step 3.1 — AuthContext
**State**
- `isAuthed: boolean`
- `loading: boolean`
- `refreshAuth(): Promise<void>`

**Rules**
- `refreshAuth()` calls `GET /api/habits/me`
- If `200`, set authed + store the returned state (or store separately)
- If `401`, set not authed and clear private state

**DoD**
- Refresh page keeps correct auth state (cookie-based)
- `/app` never shows private UI if not authed

---

### Step 3.2 — Route protection
**Action**
- If user hits `/app` while not logged in:
  - redirect to `/public/ekam-xeffect` (not `/login`, because `/` already funnels)

**DoD**
- `/app` is protected and stable

---

## Phase 4 — Public Page (Read-Only)

### Step 4.1 — Build `/public/:slug`
**Action**
- Fetch `GET /api/public/:slug`
- Render:
  - title
  - streak metadata
  - 21-box grid (all non-editable)
  - CTA button: “Create your own” → goes to `/login`

**DoD**
- Public page loads without auth
- All boxes show but cannot be clicked

---

### Step 4.2 — Missing public habit behavior
Backend returns placeholder with `habit: null`.

**Action**
- Show:
  - empty chart (all false)
  - CTA “Create your own”
  - short explanation: “No public habit found, here’s an empty chart.”

**DoD**
- No crash
- Clean empty-state UX

---

## Phase 5 — Private Dashboard (`/app`)

### Step 5.1 — Load private habit state
**Action**
- On `/app`, call `GET /api/habits/me`
- Render based on:
  - `habit === null` → show “Create habit” button → opens modal
  - `habit !== null` → show grid + actions

**DoD**
- `/app` loads state and renders correctly
- Error handling is visible and consistent

---

### Step 5.2 — HabitGrid component
**Rules**
- Always render 21 boxes
- Styles:
  - done: visually filled (DaisyUI style)
  - not done: neutral
  - editable: highlighted + clickable

**DoD**
- Exactly one editable box when allowed
- No editable boxes when `checkedInToday=true` or `allDone=true`

---

### Step 5.3 — Save Today action
**Action**
- Clicking editable box triggers `POST /api/habits/:id/save`
- Update UI from server response

**DoD**
- First click updates streak + grid
- Second click is safe (idempotent) and UI stays consistent

---

## Phase 6 — Create Habit Modal (DaisyUI)

### Step 6.1 — Modal behavior
**Action**
- Modal opens from `/app` when `habit === null`
- Contains:
  - input (max 60)
  - Create button
  - Cancel

**Rules**
- Client-side validate (1..60)
- On submit call `POST /api/habits`
- Close modal on success and show new state

**DoD**
- Habit gets created and dashboard updates without refresh
- Validation errors show inside modal

---

## Phase 7 — Rename Habit (Optional but recommended)

### Step 7.1 — Rename modal or inline
**Action**
- A “Rename” button opens a modal (consistent UX)
- Calls `PATCH /api/habits/:id`

**DoD**
- Name updates and persists after refresh

---

## Phase 8 — Login Flow

### Step 8.1 — `/login` page
**Action**
- One primary CTA: “Continue with Google”
- Button navigates user to backend Google auth entry route

**After redirect back**
- Call `refreshAuth()`
- Redirect to `/app` on success, else `/public/ekam-xeffect`

**DoD**
- Login brings user into `/app` with loaded state
- No manual token storage in frontend

---

## Phase 9 — UX Polish

### Step 9.1 — Loading states
**Action**
- Skeleton for grid + metadata on both public and private pages

**DoD**
- No flashing or awkward layout shifts

---

### Step 9.2 — Error banners
**Action**
- Standard DaisyUI alert component
- Show `message`, optionally show `code` in small text

**DoD**
- Every failed request is visible to user

---

### Step 9.3 — AI milestone display
**Action**
- If `ai` exists in state, show a “Milestone” card/banner

**DoD**
- Shown only when present
- Does not duplicate across refreshes

---

## Final Manual Test Checklist
- Visiting `/` redirects properly:
  - logged out → `/public/ekam-xeffect`
  - logged in → `/app`
- Public page loads and is read-only
- `/app` redirects if logged out
- Create habit modal works
- Save today works and is idempotent
- Rename works (if implemented)
- Refresh preserves auth state

---

## Suggested Commits
1. `chore(frontend): init vite react ts tailwind daisyui router`
2. `feat(frontend): api client + typed contracts`
3. `feat(frontend): smart redirect on home + auth context`
4. `feat(frontend): public page + read-only grid`
5. `feat(frontend): private dashboard + create habit modal`
6. `feat(frontend): save today + idempotent UX`
7. `feat(frontend): polish loading + errors + milestone card`