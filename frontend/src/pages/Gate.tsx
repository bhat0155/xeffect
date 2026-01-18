import { Navigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";

export default function Gate(){
    const {loading, isAuthed} = useAuthContext();

    if(loading){
          return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
    }

    return isAuthed ? (<Navigate to="/app"></Navigate>) : (<Navigate to="/public/ekam-xeffect"></Navigate>)

}