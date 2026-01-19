import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import HabitGrid from "../components/HabitGrid";
import type { HabitState } from "../types/habit";
import { useState } from "react";

export default function AppPage() {
  const { loading, isAuthed, myState, refreshAuth } = useAuth();
  const [isCreateOpen, setCreateOpen] = useState(false)

  // 1) Loading gate
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // 2) Auth gate
  if (!isAuthed) {
    return <Navigate to="/public/ekam-xeffect" replace />;
  }

  // 3) If user is authed but we somehow didn't get data, show a recovery UI
  if (!myState) {
    return (
      <div className="min-h-screen">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="alert alert-warning">
            <span>Could not load your state. Try refreshing.</span>
            <button className="btn btn-sm" onClick={refreshAuth}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Strongly typed alias (helps your brain)
  const s: HabitState = myState;

  const habitName = s.habit?.name ?? "My Habit";
  const bestStreak = s.habit?.bestStreak ?? 0;

  return (
    <div className="min-h-screen">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="text-3xl font-bold">My Progress (Private)</div>

        {/* Top summary card */}
        <div className="card bg-base-100 border">
          <div className="card-body space-y-4">
            {/* If habit exists, show its name prominently */}
            <div className="flex flex-col gap-2">
              <div className="text-xl font-semibold">
                {s.habit ? habitName : "No habit yet"}
              </div>

              {/* Metadata row (safe even if habit is null) */}
              <div className="flex flex-wrap gap-2">
                <div className="badge badge-outline">Today: {s.todayUTC}</div>
                <div className="badge badge-outline">Streak: {s.currentStreak}</div>
                <div className="badge badge-outline">Best: {bestStreak}</div>
                <div className="badge badge-outline">
                  Checked today: {s.checkedInToday ? "Yes" : "No"}
                </div>
              </div>

              {/* Empty-state helper text + button (modal comes next step) */}
              {!s.habit && (
                <div className="mt-2">
                  <p className="opacity-80">
                    You don’t have a habit yet. Create one to start tracking.
                  </p>

                  {/* Button is wired later to open modal */}
                  <button className="btn btn-primary mt-3" type="button" onClick={()=> setCreateOpen(true)}>
                    Create Habit
                  </button>
                  {isCreateOpen && (
                    <div className="alert alert-info mt-4">
                        <span>Modal will go here next. (Day 3)</span>
                        <button className="btn btn-sm" onClick={() => setCreateOpenxz(false)}>
                        Close
                        </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Grid card */}
            <div className="card bg-base-100 border">
              <div className="card-body">
                {/* Read-only for now. Day 3 we’ll allow clicking editable box + call /save */}
                <HabitGrid boxes={s.boxes} readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}