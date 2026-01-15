import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { getHabitStateForUser } from "../services/habitState.service";
import {prisma} from "../config/prisma";
import { getTodayUTCDate } from "../utils/utc";
import { getMilestoneAIMessage } from "../services/aiMilestone.service";

const router = Router();

// Protected route to get habit state for authenticated user
router.get("/me", requireAuth, async (req,res)=>{
    const userId = req.userId as string;
    const state = await getHabitStateForUser(userId);
    res.status(200).json(state)
})

router.post("/", requireAuth, async (req,res)=>{
    const userId = req.userId as string;
    const name = (req.body?.name ?? "").trim();
    if(!name || name.length > 60){
        return res.status(400).json({code: "VALIDATION_ERROR", message: "Habit name should be between 1 and 60 characters"})
    };

    // delete old habit if exists
    await prisma.habit.deleteMany({where: {userId}});

    // create new habit
    await prisma.habit.create({
        data: {
            userId,
            name,
            isPublic: userId === process.env.EKAM_USER_ID,
            publicSlug: userId === process.env.EKAM_USER_ID ? "ekam-xeffect" : null
        }
    })

    const state= await getHabitStateForUser(userId);
    res.status(201).json(state)
})

router.patch("/:id", requireAuth, async (req,res)=>{
    const userId = req.userId as string;
    const habitId = req.params.id;
    const name = (req.body?.name ?? "").trim();
    if(!name || name.length > 60){
        return res.status(400).json({code: "VALIDATION_ERROR", message: "Habit name should be between 1 and 60 characters"})
    };

    const habit = await prisma.habit.findFirst({where: {id: habitId, userId}, select: {id: true}});
   if(!habit){
    return res.status(404).json({code: "NOT_FOUND", message: "Habit not found"})
   }

   await prisma.habit.update({
    where: {id: habitId},
    data: {name}
   })

   const state = await getHabitStateForUser(userId);
   res.status(200).json(state)
});

router.post("/:id/save", requireAuth, async (req, res)=>{
    const userId = req.userId as string;
    const habitId = req.params.id;

    // ownership check
    const habit = await prisma.habit.findFirst({where: {id: habitId, userId}, select: {id: true, allDone: true, name: true, lastMilestoneReached: true}});
    if(!habit){
        return res.status(404).json({code: "NOT_FOUND", message: "Habit not found"})
    }
    if(habit.allDone){
        return res.status(400).json({code: "HABIT_COMPLETED", message: "Habit already completed"});
    }

    // insert today's checkin
    const todayUTC = getTodayUTCDate();
    const todayDate = new Date(`${todayUTC}T00:00:00.000Z`);
   
    try {
         await prisma.habitCheckin.create({
        data: {
            habitId,
            checkinDate: todayDate
        }
    })
    }catch(err){
         if ((err as any)?.code !== "P2002") {
      throw err; 
    }
    }
    const state = await getHabitStateForUser(userId);

    // AI milestone message
    const ai = await getMilestoneAIMessage(
        habit.name,
        state.currentStreak,
        habit.lastMilestoneReached
    );
    if(ai){
        await prisma.habit.update({
            where: {id: habitId},
            data: {lastMilestoneReached: ai.milestoneDay}   
        })
        state.ai = ai;
    }

    // update best streak if needed
    const nextBest = Math.max(state?.habit?.bestStreak ?? 0, state.currentStreak);
    if(state.habit && nextBest > state.habit.bestStreak){
        await prisma.habit.update({
        where: {id: habitId},
        data: {bestStreak: nextBest}
    })
        state.habit.bestStreak = nextBest
    }

    // update allDone if needed
    if(state.habit && state.currentStreak >=21 && !state.habit.allDone){
        await prisma.habit.update({
            where: {id: habitId},
            data: {allDone: true}
        });
        state.habit.allDone = true
    }
    res.status(201).json(state);
})

// public route to get habit state by public slug
router.get("/:publicSlug", async (req, res)=>{
    const publicSlug = (req.params.publicSlug ?? "").trim();
    if(!publicSlug){
        return res.status(400).json({code: "VALIDATION_ERROR", message: "Public slug is required"})
    }

    const habit = await prisma.habit.findFirst({
        where: {publicSlug, isPublic: true},
        select: {userId: true, id: true, name: true}
    });
    if(!habit){
        return res.status(404).json({code: "NOT_FOUND", message: "Public habit not found"});
    }

    const state = await getHabitStateForUser(habit.userId);
    const readOnlyState = {
        ...state,
        boxes: state.boxes.map(item=> ({...item, canEdit: false})),
    }
    res.status(200).json(readOnlyState);
})

export default router;