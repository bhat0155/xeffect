export type HabitBox = {
    day: number;
    status: boolean;
    canEdit: boolean;
}

export type HabitMeta = {
    id: string;
    name: string;
    bestStreak: number;
    allDone: boolean;
    isPublic: boolean;
    publicSlug: string | null;
}

export type AIPayload = {
    milestoneDay: 1| 3 | 7 | 14 | 21
    message: string
}

export type HabitState = {
    habit: HabitMeta | null;
    todayUTC: string;
    checkedInToday: boolean;
    currentStreak: number;
    boxes: HabitBox[];
    ai?: AIPayload | null;
}

export type ApiError = {
    code: string;
    message: string;
}

export * from "./habitState";

