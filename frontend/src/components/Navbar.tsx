import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
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

        <button className="btn btn-primary">Login</button>
      </div>
    </div>
  );
}