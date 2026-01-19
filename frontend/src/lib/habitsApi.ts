import { apiFetch } from "./api";
import type { HabitState } from "../types/habit";

export function getMe(): Promise<HabitState> {
    return apiFetch<HabitState>("/api/habits/me");
}

export function getPublic(slug: string): Promise<HabitState>{
    return apiFetch<HabitState>(`/api/public/${encodeURIComponent(slug)}`)
}

export function logout(): Promise<{loggedOut: boolean}>{
    return apiFetch<{loggedOut: boolean}>("/auth/logout", {method: "POST"});
}

export function saveToday(habitId: string): Promise<HabitState>{
    return apiFetch<HabitState>(`/api/habits/${habitId}/save`, {method: "POST"})
}

export function createHabit(name: string): Promise<HabitState>{
    return apiFetch<HabitState>(`/api/habits`, {
        method: "POST",
        body: JSON.stringify({name})
    })
}

export function renameHabit(habitId: string, name: string): Promise<HabitState>{
    return apiFetch<HabitState>(`/api/habits/${habitId}`, {
        method: "PATCH",
        body: JSON.stringify({name})
    })
}