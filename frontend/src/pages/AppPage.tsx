import Navbar from "../components/Navbar";

export default function AppPage() {
  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h1 className="card-title text-2xl">Private Dashboard</h1>
            <p className="opacity-80">
              Placeholder for now. Next step we’ll call <code>/api/habits/me</code> and render real state.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}