import { Router } from "express";
import {prisma} from "../config/prisma"
import { getHabitStateForUser } from "../services/habitState.service";

const router= Router()

// public route to get habit state by public slug
router.get("/:publicSlug", async (req, res)=>{
    const publicSlug = (req.params.publicSlug ?? "").trim();
    if(!publicSlug){
        return res.status(404).json({code: "VALIDATION_ERROR", message: "Public slug is required"})
    }

    const habit = await prisma.habit.findFirst({
        where: {publicSlug, isPublic: true},
        select: {userId: true, id: true, name: true}
    });

    if(!habit){
        return res.status(404).json({code: "MISSING_HABIT", message: "habit not found"})
    }

    const ekam = await prisma.user.findUnique({
        where: {id: habit.userId},
        select: {id: true}
    })

    if(!ekam){
        return res.status(404).json({code: "MISSING_ADMIN", message: "Ekam Id not found"})
    }

    if(!habit){
         const state = await getHabitStateForUser(ekam.id);
         const placeholder =  {
            ...state,
            habit: null,
            checkedInToday: false,
            currentStreak: 0,
            boxes: state.boxes.map((b) => ({ ...b, status: false, canEdit: false })),
            ai: undefined,
            
         }
         return res.status(200).json(placeholder)

    }

    const state=await getHabitStateForUser(habit.userId);
    const readOnlyState = {
        ...state,
        boxes: state.boxes.map((item)=>({
            ...item,
            canEdit: false
        }))
    }

    
    res.status(200).json(readOnlyState);
})

export default router