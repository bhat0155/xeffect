import Navbar from "../components/Navbar";

export default function About() {
  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h1 className="card-title text-2xl">About XEffect</h1>
            <p className="opacity-80">
              XEffect is a simple 21-day habit tracker with a public share page and a private dashboard.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}