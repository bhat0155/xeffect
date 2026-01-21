import { Link, NavLink, useNavigate } from "react-router-dom";
import {  apiUrl } from "../lib/api";
import { useAuthContext } from "../contexts/AuthContext";
import { logout } from "../lib/habitsApi";

export default function Navbar() {
    const navigate = useNavigate();
    const {loading, isAuthed, refreshAuth} = useAuthContext();

    const handleLogin = () =>{
        window.location.href = apiUrl("/auth/google")
    }

    const handleLogout = async () =>{
        try{
            await logout()
        }catch(err){
            console.log(err)
        }finally{
            await refreshAuth();
            navigate("/public/ekam-xeffect", {replace: true})
        }
    }
  return (
    <div className="navbar bg-base-100 border-b px-2 sm:px-4">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-lg sm:text-xl">
          XEffect
        </Link>
      </div>

      <div className="flex-none flex items-center gap-2">
        <ul className="menu menu-horizontal px-1 flex items-center">
          <li className="hidden sm:block">
            <NavLink to="/" end>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/about">About</NavLink>
          </li>
        </ul>

        {loading ? ( <span className="loading loading-spinner loading-sm" />): isAuthed ? ( <button className="btn btn-outline btn-sm sm:btn-md" onClick={handleLogout}>
            Logout
          </button>):
          <button className="btn btn-primary btn-sm sm:btn-md" onClick={handleLogin}>Login</button>
          }
        
      </div>
    </div>
  );
}
