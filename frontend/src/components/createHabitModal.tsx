import { useState } from "react";
import type { ApiError } from "../types/habit";
import { createHabit } from "../lib/habitsApi";

type Props = {
  onClose: () => void;
  onCreated: () => Promise<void>;
};

export default function CreateHabitModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<ApiError | null>(null);

  async function handleCreate() {
    const trimmed = name.trim();

    // Client-side validation
    if (!trimmed || trimmed.length > 60) {
      setErr({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Habit name should be between 1 and 60 characters",
      });
      return;
    }

    try {
      setSubmitting(true);
      setErr(null);

      await createHabit(trimmed);
      await onCreated();

      onClose(); // unmounts the modal (since parent stops rendering it)
    } catch (e: any) {
      setErr(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box w-11/12 max-w-md">
        <h3 className="font-bold text-lg">Create your habit</h3>

        <p className="opacity-70 mt-2">
          One habit at a time. Keep it short and measurable.
        </p>

        <div className="mt-4">
          <label className="label">
            <span className="label-text">Habit name</span>
          </label>

          <input
            className="input input-bordered w-full"
            placeholder="e.g., cold shower"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            disabled={submitting}
          />

          <div className="mt-2 text-sm opacity-70">{name.trim().length}/60</div>
        </div>

        {err && (
          <div className="alert alert-warning mt-4">
            <span>
              {err.message} <span className="opacity-60">({err.code})</span>
            </span>
          </div>
        )}

        <div className="modal-action flex flex-col sm:flex-row gap-2">
          <button className="btn w-full sm:w-auto" onClick={onClose} disabled={submitting}>
            Cancel
          </button>

          <button
            className="btn btn-primary w-full sm:w-auto"
            onClick={handleCreate}
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      {/* backdrop click */}
      <div className="modal-backdrop" onClick={submitting ? undefined : onClose} />
    </div>
  );
}
