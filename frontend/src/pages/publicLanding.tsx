import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function PublicLanding() {
  const params = useParams();
  const slug = (params.slug ?? "ekam-xeffect").trim();

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <main className="max-w-5xl mx-auto p-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h1 className="card-title text-3xl">Build consistency. Track 21 days.</h1>
            <p className="opacity-80">
              This is the public view. Later we’ll fetch <code>/api/public/:slug</code> here.
            </p>

            {/* Hero placeholder */}
            <div className="mt-4">
              <div className="w-full h-56 rounded-box bg-base-300 flex items-center justify-center">
                <span className="opacity-60">Hero Image Placeholder</span>
              </div>
            </div>

            {/* Slug */}
            <div className="mt-4">
              <div className="badge badge-neutral badge-lg">public slug</div>
              <div className="mt-2 font-mono text-sm">{slug}</div>
            </div>

            {/* CTA placeholder */}
            <div className="mt-6">
              <button className="btn btn-outline">Create your own</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}