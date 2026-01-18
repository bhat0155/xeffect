import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";

export default function AppPage() {
    const {loading, isAuthed, myState}=useAuth();

    if(loading){
          return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
    }

    if(!isAuthed){
  if (!isAuthed) return <Navigate to="/public/ekam-xeffect" replace />;

    }
return (
    <div className="min-h-screen">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="text-3xl font-bold">My Progress (Private)</div>

        <div className="card bg-base-100 border">
          <div className="card-body">
            <div className="text-xl font-semibold">State (Day 1: JSON debug)</div>
            <pre className="p-4 rounded-xl bg-base-200 overflow-auto text-sm">
              {JSON.stringify(myState, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}