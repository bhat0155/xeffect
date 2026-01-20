import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import HabitGrid from "../components/HabitGrid";
import type { HabitState } from "../types/habit";
import { useMemo, useState } from "react";
import { saveToday } from "../lib/habitsApi";
import CreateHabitModal from "../components/createHabitModal";

export default function AppPage() {
  const { loading, isAuthed, myState, refreshAuth } = useAuth();

  // Prevent double-click spam while the request is in-flight
  const [saving, setSaving] = useState(false);

  // Show a user-visible error if save fails (network / 500 / etc.)
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);

  // Find the editable day (backend controls this)
  // (Uses optional chaining so it never crashes while data is loading)
  const editableDay = useMemo(() => {
    const box = myState?.boxes?.find((b) => b.canEdit);
    return box?.day ?? null;
  }, [myState?.boxes]);

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

  // 3) Data gate (should be rare, but avoids crashes)
  if (!myState) {
    return (
      <div className="min-h-screen">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="alert alert-warning flex justify-between">
            <span>Could not load your state. Try again.</span>
            <button className="btn btn-sm" onClick={refreshAuth}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s: HabitState = myState;

  const habitName = s.habit?.name ?? "My Habit";
  const bestStreak = s.habit?.bestStreak ?? 0;

  const canSaveToday =
    !!s.habit &&
    !s.habit.allDone &&
    !s.checkedInToday &&
    editableDay !== null &&
    !saving;

  async function handleSaveToday() {
    if (!s.habit) return;
    if (!canSaveToday) return;

    setSaveErr(null);
    setSaving(true);

    try {
      await saveToday(s.habit.id);
      await refreshAuth(); // backend is source of truth
    } catch (e: any) {
      setSaveErr(e?.message ?? "Failed to save today. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Close modal after create succeeds + refresh state
  async function handleCreated() {
    await refreshAuth();
    setOpenModal(false);
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="text-3xl font-bold">My Progress (Private)</div>

        <div className="card bg-base-100 border">
          <div className="card-body space-y-4">
            {/* Title */}
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

            {/* If no habit exists, show ONLY the create UX (don’t show “save” alerts) */}
            {!s.habit ? (
              <div className="space-y-3">
                <div className="alert alert-info">
                  <span>You don’t have a habit yet. Create one to start tracking.</span>
                </div>

                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setOpenModal(true)}
                >
                  Create a habit
                </button>

                {openModal && (
                  <CreateHabitModal
                    onClose={() => setOpenModal(false)}
                    onCreated={handleCreated}
                  />
                )}

                {/* Grid still renders (read-only) so the page looks consistent */}
                <div className="card bg-base-100 border">
                  <div className="card-body">
                    <HabitGrid boxes={s.boxes} readOnly />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Save status + hint (only when habit exists) */}
                {s.habit.allDone ? (
                  <div className="alert alert-success">
                    <span>Completed 🎉 You finished all 21 days.</span>
                  </div>
                ) : s.checkedInToday ? (
                  <div className="alert alert-info">
                    <span>Done for today. Come back tomorrow.</span>
                  </div>
                ) : editableDay ? (
                  <div className="alert alert-info flex justify-between">
                    <span>Click Day {editableDay} to check in for today.</span>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={handleSaveToday}
                      disabled={!canSaveToday}
                    >
                      {saving ? "Saving..." : "Save Today"}
                    </button>
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <span>No editable day right now.</span>
                  </div>
                )}

                {/* Save error */}
                {saveErr && (
                  <div className="alert alert-error">
                    <span>{saveErr}</span>
                  </div>
                )}

                {/* Grid (clickable only when allowed) */}
                <div className="card bg-base-100 border">
                  <div className="card-body">
                    <HabitGrid
                      boxes={s.boxes}
                      readOnly={!canSaveToday}
                      onClickDay={() => handleSaveToday()}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}