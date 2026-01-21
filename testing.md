# test.md — XEffect Manual Test Plan (Frontend + Backend)

> Goal: verify all critical user flows end-to-end (guest + logged-in), including happy paths and failure/edge cases.
> This is written as a checklist you can run repeatedly before pushing/releasing.

---

## 0) Preconditions / Setup

### 0.1 Services running
- Backend running on `http://localhost:4000`
- Frontend running on `http://localhost:5173` (or your current dev port)

### 0.2 Env sanity
- Backend has:
  - `FRONTEND_ORIGIN` set to your frontend origin (e.g. `http://localhost:5173`)
  - `JWT_SECRET` set
- Frontend has:
  - `VITE_API_URL` set to backend origin (e.g. `http://localhost:4000`)
- Cookie auth: frontend requests include `credentials: "include"` (already in `apiFetch`)

### 0.3 Known routes to test
- `/` (smart redirect)
- `/public/ekam-xeffect` (public progress)
- `/about`
- `/app` (private dashboard)
- `/login` (if you kept it)
- `*` (not-found / fallback behavior)

### 0.4 Useful tools during testing
- Browser DevTools:
  - Network tab (check request status codes + Set-Cookie)
  - Application → Cookies (check `xeffect_token`)
- Optional DB access (Prisma Studio / DB GUI) only for specific edge cases.

---

## 1) Smoke Tests (Quick sanity)

### 1.1 Frontend boots
**Steps**
1. Open `http://localhost:5173/`

**Expected**
- App loads without console errors
- Navbar visible on pages that should show it

**Failure signals**
- Blank page
- Console: React errors / hook order errors / runtime exceptions

---

## 2) Guest (Not Logged In) Tests

### 2.1 `/` smart redirect for guest
**Steps**
1. Open `http://localhost:5173/` in a fresh session (or after logout)

**Expected**
- Redirects to `/public/ekam-xeffect`

**Failure signals**
- Redirect loop
- Ends on `/app`
- Stuck spinner forever

---

### 2.2 Public page renders correctly
**Steps**
1. Open `http://localhost:5173/public/ekam-xeffect`

**Expected**
- Navbar shows Home/About (and Login action if present)
- Hero banner shows placeholder quote area (visible)
- Public header section shows habit name, date, streak, best
- 21-box grid renders and is read-only:
  - clicking boxes does nothing
- CTA section is visible:
  - "Create your own" (or equivalent) visible and clickable

**Failure signals**
- Grid missing or < 21 boxes
- Boxes are clickable
- CTA not visible
- Hero / CTA layout not visible due to CSS

---

### 2.3 Public page styling requirements
**Expected**
- Boxes border:
  - Light mode: black borders
  - Dark mode: white borders (and done boxes green border in dark mode, if you implemented)
- Done boxes display `"X"` not checkmark
- CTA card has border in light mode (per your request)

**Failure signals**
- No borders on boxes
- Done boxes show ✓
- CTA card border missing in light mode

---

### 2.4 Guest cannot access `/app`
**Steps**
1. Open `http://localhost:5173/app` while not logged in

**Expected**
- Redirects to `/public/ekam-xeffect`

**Failure signals**
- Private UI shows
- Error page crashes

---

### 2.5 Guest /public endpoint failure handling
**Setup**
- Stop backend OR temporarily break public endpoint.

**Steps**
1. Refresh `/public/ekam-xeffect`

**Expected**
- UI still renders (empty fallback state)
- Shows a warning banner (or at minimum doesn’t crash)

**Failure signals**
- White screen / crash
- Endless loading

---

## 3) Login Tests (OAuth)

### 3.1 Login from UI starts OAuth
**Steps**
1. Click Login (navbar or `/login` page)

**Expected**
- Browser navigates to backend OAuth route (`/auth/google`)
- Google consent page appears

**Failure signals**
- Button does nothing
- Opens wrong URL
- CORS errors in console (should not be an XHR; it’s a navigation)

---

### 3.2 OAuth callback returns to frontend and authenticates
**Steps**
1. Complete Google login

**Expected**
- Redirect back to frontend origin
- Cookie `xeffect_token` appears in browser cookies for backend domain
- Frontend auth detection shows logged-in state:
  - `/` should route you to `/app`

**Failure signals**
- Redirects to wrong port/origin
- Cookie not created
- Landing back but still treated as guest (likely auth refresh not triggered)

---

## 4) Logged In (New Member) — No Habit Yet

> This assumes backend can return `habit: null` for new users.

### 4.1 `/` redirect for logged-in user
**Steps**
1. Open `http://localhost:5173/`

**Expected**
- Redirects to `/app`

**Failure signals**
- Redirects to public
- Spinner forever

---

### 4.2 `/app` renders "no habit" state
**Steps**
1. Open `/app`

**Expected**
- Shows "No habit yet" UI
- Shows "Create a habit" CTA
- Does NOT show Save-Today controls (because habit doesn’t exist)
- Grid still renders read-only (to keep layout stable)

**Failure signals**
- No create CTA
- Save Today UI appears without habit
- Crash due to null habit references

---

### 4.3 Create habit modal opens/closes
**Steps**
1. Click "Create a habit"
2. Modal opens
3. Click Cancel/Close

**Expected**
- Modal opens and closes reliably
- No console warnings about effects/state loops

**Failure signals**
- Modal doesn’t close
- React warning: effect causing cascading renders
- Focus traps broken (not critical, but note)

---

### 4.4 Create habit validation (frontend + backend)
**Steps**
1. Open create modal
2. Submit empty name
3. Submit >60 chars
4. Submit valid name

**Expected**
- Invalid: show user-friendly error (no crash)
- Valid: habit created, modal closes, `/app` updates without hard refresh

**Failure signals**
- Backend returns 400 but UI doesn’t show error
- Modal closes but state doesn’t refresh
- Created habit name not shown after refresh

---

## 5) Logged In (Existing Habit) — Private Dashboard Core

### 5.1 `/app` loads full state
**Steps**
1. Open `/app`

**Expected**
- Shows habit name, todayUTC, streak, best streak
- Grid shows done boxes
- Editable day is controlled by backend (`canEdit`)

**Failure signals**
- Missing metadata
- Grid mismatches backend response
- Hook order errors (must not happen)

---

### 5.2 Save Today (happy path)
**Preconditions**
- `checkedInToday` is false
- Exactly one box has `canEdit: true`

**Steps**
1. Click the editable box OR click Save Today button (whichever UX you have)

**Expected**
- Request `POST /api/habits/:id/save` fires once
- UI updates immediately from returned state (no need to refresh)
- `checkedInToday` becomes true
- "Done for today" banner appears (green background)
- Boxes become non-clickable after save

**Failure signals**
- Save button stays enabled after success
- Multiple requests on one click (spam)
- UI updates only after manual refresh
- Editable box still clickable after save

---

### 5.3 Save Today idempotency behavior
**Steps**
1. Click Save Today again the same day

**Expected**
- Either blocked by UI OR request returns gracefully
- UI remains consistent and does not duplicate milestone UI

**Failure signals**
- Error explosion / crash
- Streak increments incorrectly
- Duplicate milestone banners

---

### 5.4 Milestone / AI banner behavior
**Preconditions**
- Backend returns `ai` only when a milestone is hit

**Steps**
1. Perform save that triggers `ai` (milestone day)
2. Observe banner

**Expected**
- Milestone banner appears (green, consistent styling)
- Banner persists until next refresh (as per your requirement)
- Banner does not show if `ai` is absent

**Failure signals**
- `ai` exists in response but not shown
- Banner flashes then disappears immediately
- Banner persists across refresh even when backend no longer sends it (depends on your backend design; note expected behavior)

---

### 5.5 Done-for-today banner alignment
**Steps**
1. Ensure `checkedInToday = true`
2. Look at the green alert banner

**Expected**
- Text centered horizontally

**Failure signals**
- Left aligned like screenshot

---

### 5.6 Habit completion (21 days) UI
**Preconditions**
- Create a state where `allDone = true` (can be via DB for testing)

**Steps**
1. Open `/app`

**Expected**
- Shows completed banner
- No editable day / no save action
- Grid remains read-only

**Failure signals**
- Save controls still appear
- Editable day exists

---

## 6) Rename Habit (PATCH)

### 6.1 Rename modal opens
**Steps**
1. On `/app`, click the edit icon (rename trigger)

**Expected**
- Rename modal opens
- Input prefilled with current name

**Failure signals**
- Button not visible
- Modal opens but input empty

---

### 6.2 Rename validation
**Steps**
1. Submit empty name
2. Submit >60 chars
3. Submit valid name

**Expected**
- Invalid: show error
- Valid: request `PATCH /api/habits/:id`
- UI updates immediately from returned state (preferably `setMyState(nextState)`)

**Failure signals**
- UI only updates after refresh
- Name changes but reverts on refresh

---

## 7) Logout Tests

### 7.1 Logout clears cookie and UI state
**Steps**
1. Click Logout in navbar

**Expected**
- Browser sends `POST /auth/logout` with credentials
- Cookie `xeffect_token` disappears in browser
- UI switches to logged-out state
- Redirect to `/public/ekam-xeffect`

**Failure signals**
- Cookie remains
- Still able to access `/app` without re-login
- UI still shows private state after logout

---

### 7.2 Logout behavior after refresh
**Steps**
1. Logout
2. Refresh page

**Expected**
- Still logged out
- `/` redirects to `/public/ekam-xeffect`

**Failure signals**
- Logged back in unexpectedly

---

## 8) Edge Cases / Error Scenarios

### 8.1 Backend down
**Steps**
1. Stop backend
2. Refresh `/public/ekam-xeffect`
3. Refresh `/app` (while logged in)

**Expected**
- Public: shows fallback + warning (no crash)
- App: shows recoverable error state (Retry button) OR a meaningful alert

**Failure signals**
- White screen / crash
- Infinite loading

---

### 8.2 Habit deleted manually from DB while logged in
**Steps**
1. Be logged in, on `/app`
2. Delete habit row directly in DB
3. Refresh `/app` (or call refresh in UI)

**Expected**
- UI shows "No habit yet" + Create habit CTA
- No save controls visible
- Grid still renders read-only

**Failure signals**
- UI stuck showing old habit state
- No create CTA (bug you saw earlier)

---

### 8.3 Invalid API URL / wrong port
**Steps**
1. Change `VITE_API_URL` to wrong value
2. Reload app

**Expected**
- Clear error banner on pages that fetch
- Not a silent failure

**Failure signals**
- Silent failure / endless spinner

---

## 9) Regression Checklist (Fast re-run before pushing)

- [ ] `/` redirects guest → `/public/ekam-xeffect`
- [ ] `/` redirects authed → `/app`
- [ ] Public page is read-only
- [ ] `/app` protected for guests
- [ ] Create habit works + validates
- [ ] Save Today updates immediately and blocks second save same day
- [ ] AI banner shows only when returned and persists until refresh
- [ ] Rename works + validates
- [ ] Logout clears cookie + UI state
- [ ] No hook-order errors in console

---

## Notes / Bugs Found Log (fill as you test)
Use this section to track issues while running tests.

### Bug #1
- **Scenario**:
- **Steps to reproduce**:
- **Expected**:
- **Actual**:
- **Fix**:
- **Status**: Open / Fixed

### Bug #2
- **Scenario**:
- **Steps to reproduce**:
- **Expected**:
- **Actual**:
- **Fix**:
- **Status**: Open / Fixed