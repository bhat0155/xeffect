import { useEffect, useState } from "react";
import { renameHabit } from "../lib/habitsApi";

type Props = {
  habitId: string;
  initialName: string;
  onClose: () => void;
  onRenamed: (nextState: any) => void; // keep simple like your project style
};

export default function RenameHabitModal({
  habitId,
  initialName,
  onClose,
  onRenamed,
}: Props) {
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // When modal opens, prefill input + clear previous errors
  useEffect(() => {
    setName(initialName);
    setErr(null);
  }, [initialName]);

  async function handleSubmit() {
    const trimmed = name.trim();

    // client guard (backend also validates)
    if (trimmed.length < 1 || trimmed.length > 60) {
      setErr("Habit name must be between 1 and 60 characters.");
      return;
    }

    setSubmitting(true);
    setErr(null);

    try {
      const nextState = await renameHabit(habitId, trimmed);
      onRenamed(nextState); // this is where you'll call setMyState(nextState)
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Rename failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box border">
        <h3 className="font-bold text-lg">Rename Habit</h3>

        <div className="mt-4 space-y-2">
          <input
            className="input input-bordered w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Enter habit name (max 60)"
          />

          {err && (
            <div className="alert alert-error">
              <span>{err}</span>
            </div>
          )}
        </div>

        <div className="modal-action">
          <button className="btn" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}