import { Link, NavLink, useNavigate } from "react-router-dom";
import { apiFetch, apiUrl } from "../lib/api";
import { useAuthContext } from "../contexts/AuthContext";

export default function Navbar() {
    const navigate = useNavigate();
    const {loading, isAuthed, refreshAuth} = useAuthContext();

    const handleLogin = () =>{
        window.location.href = apiUrl("/auth/google")
    }

    const handleLogout = async () =>{
        try{
            await apiFetch<{loggedOut: boolean}>("/auth/logout", {method: "POST"})
        }catch(err){
            console.log(err)
        }finally{
            await refreshAuth();
            navigate("/public/ekam-xeffect", {replace: true})
        }
    }
  return (
    <div className="navbar bg-base-100 border-b">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">
          XEffect
        </Link>
      </div>

      <div className="flex-none gap-2">
        <ul className="menu menu-horizontal px-1">
          <li>
            <NavLink to="/" end>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/about">About</NavLink>
          </li>
        </ul>

        {loading ? ( <span className="loading loading-spinner loading-sm" />): isAuthed ? ( <button className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>):
          <button className="btn btn-primary" onClick={handleLogin}>Login</button>
          }
        
      </div>
    </div>
  );
}