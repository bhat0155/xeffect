import {prisma} from "../config/prisma";
import { getTodayUTCDate } from "../utils/utc";
import type { HabitBox, HabitMeta, HabitState } from "../contracts/habitState";

function buildEmptyBoxes(): HabitBox[]{
    return Array.from({length: 21}, (_, i)=>{
        return {
            day: i+1,
            status: false,
            canEdit: i===0
        }
    })
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
   }

   return {
        habit: habitMeta,
        todayUTC,
        checkedInToday: checkInToday,
        currentStreak: 0,
        boxes: buildEmptyBoxes()
   }
}