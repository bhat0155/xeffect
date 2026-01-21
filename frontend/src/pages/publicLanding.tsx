// src/pages/Public.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HabitGrid from "../components/HabitGrid";
import heroImage from "../assets/Quote_2.png";
import { getPublic } from "../lib/habitsApi";
import type { HabitState, ApiError } from "../types/habit";

const SLUG = "ekam-xeffect";

function makeEmptyState(): HabitState {
  return {
    habit: null,
    todayUTC: new Date().toISOString().slice(0, 10),
    checkedInToday: false,
    currentStreak: 0,
    boxes: Array.from({ length: 21 }, (_, i) => ({
      day: i + 1,
      status: false,
      canEdit: false,
    })),
  };
}

export default function Public() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<HabitState | null>(null);
  const [err, setErr] = useState<ApiError | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const data = await getPublic(SLUG);
        if (!alive) return;
        setState(data);
      } catch (e: any) {
        if (!alive) return;
        setErr(e);
        setState(makeEmptyState());
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  const s = state ?? makeEmptyState();
  const habitName = s.habit?.name ?? "XEffect";
  const bestStreak = s.habit?.bestStreak ?? 0;

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="bg-base-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 sm:py-8">
          <div className="w-full min-h-[24vh] sm:min-h-[50vh] bg-base-100 shadow overflow-hidden rounded-xl">
            <img
              src={heroImage}
              alt="James Clear Quote"
              className="w-full h-full object-contain block transition duration-300"
              loading="lazy"
            />
          </div>
        </div>
      </section>



      {/* SECTION: Ekam's XEffect */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold">Ekam&apos;s XEffect</h2>
          <p className="opacity-70 mt-1 text-sm sm:text-base">
            Daily consistency snapshot. Read-only view for guests.
          </p>
        </div>

        {s.habit === null && (
          <div className="alert alert-info mb-4">
            <span>No public habit found — showing an empty chart.</span>
          </div>
        )}

        {err && (
          <div className="alert alert-warning mb-4">
            <span>
              {err.message} <span className="opacity-60">({err.code})</span>
            </span>
          </div>
        )}

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            {/* Meta row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Habit name: more distinct */}
                <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold border-2 border-primary ring-2 ring-primary/30 text-sm sm:text-base">
                  {habitName}
                </span>

                <span className="badge badge-outline text-xs sm:text-sm">
                  Today: {s.todayUTC}
                </span>
                <span className="badge badge-outline text-xs sm:text-sm">
                  Streak: {s.currentStreak}
                </span>
                <span className="badge badge-outline text-xs sm:text-sm">
                  Best: {bestStreak}
                </span>
              </div>

              <div className="opacity-70 text-sm">
                {s.checkedInToday ? "Checked in today ✅" : "Not checked in today"}
              </div>
            </div>

            <div className="mt-6">
              <HabitGrid boxes={s.boxes} readOnly />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-base-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="card bg-base-100 shadow border border-black dark:border-gray-100">
            <div className="card-body items-center text-center">
              <h3 className="text-xl sm:text-2xl font-bold">Make your own XEffect</h3>
              <p className="opacity-70 max-w-2xl text-sm sm:text-base">
                Track a 21-day habit, build consistency, and share a public progress link.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link to="/login" className="btn btn-primary">
                  Create your own
                </Link>
                <Link to="/about" className="btn btn-ghost">
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
