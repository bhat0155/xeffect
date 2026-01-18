import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type PublicState = any;

export default function Public() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PublicState | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch<PublicState>("/api/public/ekam-xeffect");
        if (!alive) return;
        setData(res);
        setError(null);
      } catch (err: any) {
        if (!alive) return;
        setError({ code: err?.code || "ERROR", message: err?.message || "Failed to load public page" });
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Hero */}
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="text-3xl font-bold">XEffect</div>
            <p className="opacity-80">
              Public progress page (read-only). Share slug:
              <span className="font-mono ml-2">ekam-xeffect</span>
            </p>

            {/* Placeholder hero “image” */}
            <div className="mt-4 h-48 rounded-xl bg-base-300 flex items-center justify-center">
              <span className="opacity-70">Hero image placeholder</span>
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="card bg-base-100 border">
          <div className="card-body">
            <div className="text-xl font-semibold">Public Data (Day 1: JSON debug)</div>

            {loading && (
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner" />
                <span>Loading…</span>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <div>
                  <div className="font-semibold">{error.code}</div>
                  <div>{error.message}</div>
                </div>
              </div>
            )}

            {!loading && !error && (
              <pre className="p-4 rounded-xl bg-base-200 overflow-auto text-sm">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}