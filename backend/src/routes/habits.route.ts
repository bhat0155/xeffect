import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { getHabitStateForUser } from "../services/habitState.service";
import {prisma} from "../config/prisma";

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
})

export default router;