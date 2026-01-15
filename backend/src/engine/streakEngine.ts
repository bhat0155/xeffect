import type { HabitBox } from "../contracts/habitState";
import { addDaysUTC } from "../utils/utc";

export type EngineResult = {
    checkedInToday: boolean;
    currentStreak: number;
    boxes: HabitBox[]
}

export function hasCheckinOn(dateUTC: string, checkinSet: Set<string>): boolean {
    return checkinSet.has(dateUTC)
}

// count backward from anchor day until we find a missing day

export function computeCurrentStreak(anchorUTC: string, checkinSet: Set<string>, cap: number = 21): number {
    let streak = 0;
    let cursor = anchorUTC;

    while (streak < cap && checkinSet.has(cursor)){
        streak++;
        cursor = addDaysUTC(cursor, -1); // go to prev utc date string
    }
    return streak;
}

// build 21 boxes
// status true for days <= streak
// canEdit true only for (streak + 1)th day if not checkininToday, notAllDone and streak < 21

export function buildBoxes(currentStreak: number, checkedInToday: boolean, allDone: boolean, totalDays: number = 21): HabitBox[]{
    const nextEditableDay = currentStreak+1;

    return Array.from({length: totalDays}, (_,i)=>{
        const day = i+1;
        const status = day <=currentStreak;
        const canEdit = !checkedInToday && !allDone && currentStreak < totalDays && day === nextEditableDay;

        return {day, status, canEdit}
    })
}

// orchestraator for the engine
// db layer shuld just:
// - fetch checkins-> build a set<string> of "YYYY-MM-DD" utc dates
// - compute today/yesterday
export function computeEngineState(params: {
  todayUTC: string;
  yesterdayUTC: string;
  checkinSet: Set<string>;
  allDone: boolean;
}): EngineResult {
  const { todayUTC, yesterdayUTC, checkinSet, allDone } = params;

  const checkedInToday = hasCheckinOn(todayUTC, checkinSet);

  const anchor = checkedInToday ? todayUTC : yesterdayUTC;

  const currentStreak = computeCurrentStreak(anchor, checkinSet, 21);

  const boxes = buildBoxes(currentStreak, checkedInToday, allDone, 21);

  return { checkedInToday, currentStreak, boxes };
}