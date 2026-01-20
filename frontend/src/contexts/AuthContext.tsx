import React, { createContext, useContext } from "react";
import { useAuth } from "../hooks/useAuth";

type HabitState = any;

type AuthContextValue = {
    loading: boolean,
    isAuthed: boolean,
    myState: HabitState | null,
    refreshAuth: ()=>Promise<void>
    setMyState: (next: HabitState | null)=> void;
}

const AuthContext = createContext<AuthContextValue|null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth(); // runs once here and is shared

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(){
    const ctx = useContext(AuthContext);
    if (!ctx) {
    throw new Error("useAuthContext must be used inside <AuthProvider />");
  }
  return ctx;
}