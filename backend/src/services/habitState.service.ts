import {prisma} from "../config/prisma";
import { addDaysUTC, formatUTCDate, getTodayUTCDate,getYesterdayUTCDate } from "../utils/utc";
import type { HabitBox, HabitMeta, HabitState } from "../contracts/habitState";



function buildBoxes(currentStreak: number, checkedInToday: boolean, allDone: boolean): HabitBox[]{
    const nextEditableDay = currentStreak+1;
    return Array.from({length: 21}, (_, i)=>{
        const day = i+1;
        let status = day<=currentStreak;

        const canEdit = !allDone && !checkedInToday && day === nextEditableDay && currentStreak < 21;

        return {
            day,
            status,
            canEdit
        }
    })
}

// fetch checkins and add them to a set
function checkinsToSet(checkins: {checkinDate: Date}[]): Set<string>{
    return new Set(checkins.map((item)=>formatUTCDate(item.checkinDate)))
}

// compute current streak from checkin set
function computeCurrentStreak(anchor: string, checkinSet: Set<string>): number {
    let streak = 0;
    let cursor=anchor;
    while(streak < 21 && checkinSet.has(cursor)){
        streak++;
        cursor  = addDaysUTC(cursor, -1);
    }
    return streak;
}

export async function getHabitStateForUser(userId: string): Promise<HabitState>{
    const todayUTC = getTodayUTCDate();

    const habit = await prisma.habit.findUnique({
        where: {userId},
        select: {
            id: true,
            name: true,
            bestStreak: true,
            allDone: true,
            isPublic: true,
            publicSlug: true
        }
    });

   const habitMeta: HabitMeta | null = habit ? habit : null;

   let checkInToday = false;
   let currentStreak = 0;
   const allDone = habit ? habit.allDone : false;
   if(habit){
    const todayDate= new Date(`${todayUTC}T00:00:00.000Z`);
    const todayCheckIn = await prisma.habitCheckin.findUnique({
        where: {
            habitId_checkinDate:{
                habitId: habit.id,
                checkinDate: todayDate
            }
        },
        select: {id: true}
    })
    checkInToday = !! todayCheckIn

    // fetch all checkins for habit
    const recentCheckIns = await prisma.habitCheckin.findMany({
        where: {habitId: habit.id},
        select: {checkinDate: true},
        orderBy: {checkinDate: "desc"},
        take: 21
    })
    const checkinSet = checkinsToSet(recentCheckIns)

    // deciding anchor and computing streak
    const anchorDate = checkInToday ? todayUTC : getYesterdayUTCDate();
    currentStreak = computeCurrentStreak(anchorDate, checkinSet)
   }

   return {
        habit: habitMeta,
        todayUTC,
        checkedInToday: checkInToday,
        currentStreak: currentStreak,
        boxes: buildBoxes(currentStreak, checkInToday, allDone)
   }
}