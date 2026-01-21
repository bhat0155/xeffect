import { Navigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import HabitGrid from "../components/HabitGrid";
import type { HabitState } from "../types/habit";
import { useMemo, useState } from "react";
import { saveToday } from "../lib/habitsApi";
import CreateHabitModal from "../components/CreateHabitModal";
import RenameHabitModal from "../components/RenameModal";
import { Pencil } from "lucide-react";

export default function AppPage() {
  const { loading, isAuthed, myState, refreshAuth, setMyState } = useAuthContext();

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openRename, setOpenRename] = useState(false);

  // Find the editable day (backend controls this)
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

  // 3) Data gate
  if (!myState) {
    return (
      <div className="min-h-screen">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="alert alert-warning flex items-center justify-between">
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
      const nextState = await saveToday(s.habit.id);
      setMyState(nextState); // keep AI banner without refresh
    } catch (e: any) {
      setSaveErr(e?.message ?? "Failed to save today. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreated() {
    await refreshAuth();
    setOpenCreate(false);
  }

  return (
    <div className="min-h-screen">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <div className="text-2xl sm:text-3xl font-bold">My Progress (Private)</div>

        <div className="card bg-base-100 border">
          <div className="card-body space-y-4">
            {/* Title row + rename action */}
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg sm:text-xl font-semibold">
                {s.habit ? habitName : "No habit yet"}
              </div>

              {s.habit && (
                <button
                  className="btn btn-sm btn-outline"
                  type="button"
                  onClick={() => setOpenRename(true)}
                >
                  <Pencil size={16}/>
                </button>
              )}
            </div>

            {/* Rename modal */}
            {s.habit && openRename && (
              <RenameHabitModal
                habitId={s.habit.id}
                initialName={s.habit.name}
                onClose={() => setOpenRename(false)}
                onRenamed={(nextState) => setMyState(nextState)}
              />
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <div className="badge badge-outline">Today: {s.todayUTC}</div>
              <div className="badge badge-outline">Streak: {s.currentStreak}</div>
              <div className="badge badge-outline">Best: {bestStreak}</div>
              <div className="badge badge-outline">
                Checked today: {s.checkedInToday ? "Yes" : "No"}
              </div>
            </div>

            {/* If no habit exists */}
            {!s.habit ? (
              <div className="space-y-3">
                <div className="alert alert-info flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span>
                    You don’t have a habit yet. Create one to start tracking.
                  </span>
                  <button
                    className="btn btn-primary w-full sm:w-auto"
                    type="button"
                    onClick={() => setOpenCreate(true)}
                  >
                    Create a habit
                  </button>
                </div>

                {openCreate && (
                  <CreateHabitModal
                    onClose={() => setOpenCreate(false)}
                    onCreated={handleCreated}
                  />
                )}

                <div className="card bg-base-100 border">
                  <div className="card-body">
                    <HabitGrid boxes={s.boxes} readOnly />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Status banners */}
                {s.habit.allDone ? (
                  <div className="alert alert-success justify-center text-center">
                    <span className="w-full text-center">
                      Completed 🎉 You finished all 21 days.
                    </span>
                  </div>
                ) : s.checkedInToday ? (
                  <div className="alert alert-success justify-center text-center">
                    <span className="w-full text-center">
                      Done for today. See you tomorrow.
                    </span>
                  </div>
                ) : editableDay ? (
                  <div className="alert alert-info flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span>Click Day {editableDay} to check in for today.</span>
                    <button
                      className="btn btn-sm btn-primary w-full sm:w-auto"
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

                {/* Grid */}
                <div className="card bg-base-100 border">
                  <div className="card-body">
                    <HabitGrid
                      boxes={s.boxes}
                      readOnly={!canSaveToday}
                      onClickDay={() => handleSaveToday()}
                    />
                  </div>
                </div>

                {/* Milestone banner */}
                {s.ai && (
                  <div className="alert alert-success border border-success/40">
                    <div>
                      <div className="font-semibold">Milestone 🎉</div>
                      <div className="opacity-90">{s.ai.message}</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
