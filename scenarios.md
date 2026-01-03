# XEffect — User Scenarios (Final)

This document lists all user scenarios and locked rules for **XEffect**.
Backend is the source of truth. Frontend only renders what backend returns.

---

## Global Locked Rules

### Time Rule (Server Day)
- The server defines **today** using the **UTC date** (`YYYY-MM-DD`).
- There is no “24-hour timer”.
- The UI updates when the user refreshes (or on next fetch).

### One Active Habit
- A user can have **only 1 active habit** at a time.
- Creating a new habit **deletes** the old habit row and **cascade deletes** its checkins.

### No Undo (Ever)
- Once a day is saved as completed, the user cannot undo/revert it.
- Save becomes disabled after a successful save and stays disabled until the next UTC day.

### Save Idempotency (Safety)
- Even if the user retries (double-click, network retry, multiple tabs), saving the same day must not crash.
- DB unique constraint prevents duplicates.
- Backend should treat “already saved today” as success and return the same state.

### Completion
- After Day 21 is completed and saved:
  - Habit becomes locked (`allDone = true`)
  - No more saves allowed
  - Next action is “Add Habit” to start over

### AI Milestones
- AI suggestions appear on days: **1, 3, 7, 14, 21**
- AI triggers only:
  - after a **successful Save**
  - only **once per milestone** (de-duped using `lastMilestoneReached`)

### Confetti
- Confetti appears after each successful save.
- Special celebration confetti/message appears on Day 21 completion.

---

## Scenario 1 — Guest visits the website
**Given**
- User is not logged in.

**When**
- Guest opens the homepage.

**Then**
- They see Ekam’s public tracker (21 boxes) in **read-only mode**.
- They see a button to **Log in with Google** to create their own tracker.

---

## Scenario 2 — User logs in
**Given**
- User clicks “Log in with Google”.

**When**
- OAuth succeeds.

**Then**
- User is authenticated.
- If the user has no active habit:
  - show habit name area (empty) + 21 boxes (all unchecked)
  - show “Add Habit” button

---

## Scenario 3 — User creates a new habit
**Given**
- User is logged in.

**When**
- User clicks “Add Habit” and enters a habit name.

**Then**
- Backend creates a new habit for the user.
- UI shows:
  - Day 1: `status=false, canEdit=true`
  - Day 2..21: locked (`status=false, canEdit=false`)
- Save button is enabled (because today is not yet checked).

---

## Scenario 4 — User completes a day (Save)
**Given**
- Today’s editable day is available (e.g., Day 1 / Day 3 / etc.).

**When**
- User marks the editable day in the UI and clicks **Save**.

**Then**
- Backend inserts a `HabitCheckin` row for `todayUTC`.
- Backend recomputes streak and returns updated state.
- UI:
  - shows an X for the saved day
  - disables Save button until tomorrow (UTC date changes)
  - shows confetti
  - if the day is a milestone (1/3/7/14/21), show AI message

---

## Scenario 5 — User maintains a streak
**Given**
- User checks in on consecutive UTC dates.

**When**
- User saves each day successfully.

**Then**
- The streak increases by 1 each day.
- Only the next day becomes editable on the next UTC date.

---

## Scenario 6 — User misses a day (streak reset)
**Given**
- User had a streak (e.g., 4 days) but does not check in the next UTC day.

**When**
- The user returns later and refreshes/loads the dashboard.

**Then**
- Backend computes streak as reset (no consecutive chain to yesterday/today).
- UI shows a fresh start:
  - Day 1 editable again
  - all boxes unchecked except future ones locked
- Old checkins may exist historically, but they do not count toward the current streak.

---

## Scenario 7 — AI milestone messages
**Given**
- Milestones are Day 1, 3, 7, 14, 21.

**When**
- User successfully saves a day that hits a milestone.

**Then**
- Backend triggers AI message once per milestone (de-dupe).
- UI shows the AI message after the save response.

---

## Scenario 8 — Completion (Day 21)
**Given**
- User reaches Day 21 and successfully saves it.

**When**
- Save completes and streak = 21.

**Then**
- Backend sets `allDone = true`.
- UI:
  - shows “Congratulations” + confetti + AI completion message
  - disables Save permanently
  - shows “Add Habit” as the next step

---

## Scenario 9 — User clicks “Add Habit” mid-way (or after checking today)
**Given**
- User has an active habit (any progress).

**When**
- User clicks “Add Habit” and creates a new habit.

**Then**
- Backend deletes old habit + cascade deletes old checkins.
- Backend creates new habit.
- New habit starts immediately:
  - Day 1 unchecked and editable today
  - others locked
- The old habit’s records are no longer accessible.

---

## Scenario 10 — Day change while the user is on the page
**Given**
- User keeps the page open across UTC midnight.

**When**
- User refreshes (or the app re-fetches state).

**Then**
- Backend uses the new `todayUTC` and returns updated editable day if applicable.
- UI reflects the new day state after refresh.

---

## Scenario 11 — Public page always shows Ekam’s habit
**Given**
- Guest visits public homepage.

**When**
- Ekam’s public habit exists:
  - show it read-only

**If Ekam’s habit was deleted:**
- show a placeholder empty 21-box tracker (read-only)

---

## Notes / Implementation Guardrails

- Frontend should not compute streak logic. It should render based on backend state.
- Backend never trusts any date sent from the client.
- DB unique constraint `(habitId, checkinDate)` is mandatory.
- `bestStreak` is stored on Habit and updated whenever computed streak exceeds it.
- `lastMilestoneReached` is stored on Habit for milestone de-dupe.
- `allDone` locks the habit permanently after completion.