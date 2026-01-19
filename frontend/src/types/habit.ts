export type HabitBox = {
    day: number;
    status: boolean;
    canEdit: boolean;
}

export type Habit = {
    id: string;
    name: string;
    bestStreak: number;
    allDone: boolean;
    isPublic: boolean;
    publicSlug: string | null;
}

export type MilestoneAI = {
    mileStoneDay: number;
    title: string;
    message: string;
}

export type HabitState = {
    habit: Habit | null;
    todayUTC: string;
    checkedInToday: boolean;
    currentStreak: number;
    boxes: HabitBox[];
    ai?: MilestoneAI;
}

export type ApiError = {
    status: number;
    code: string;
    message: string
}
