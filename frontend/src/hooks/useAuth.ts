import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { getMe } from "../lib/habitsApi";

type HabitState = any;

export function useAuth(){
    const [loading, setLoading]=useState(true);
    const [isAuthed, setIsAuthed] = useState(false);
    const [myState, setMyState]=useState<HabitState | null>(null);

    const refreshAuth = useCallback(async()=>{
        setLoading(true);
        try{
            const data = await getMe()
            setIsAuthed(true);
            setMyState(data)
        }catch(err: any){
            if(err?.status===401){
                setIsAuthed(false);
                setMyState(null);
            }else{
                console.log("refreshAuth failed", err);
                setIsAuthed(false);
                setMyState(null)
            }
        }finally {
            setLoading(false)
        }
    }, [])

    useEffect(()=>{
        refreshAuth()
    },[refreshAuth])

    return {loading, isAuthed, myState, refreshAuth, setMyState};
}
