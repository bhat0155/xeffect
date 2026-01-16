import { Router } from "express";
import {prisma} from "../config/prisma"
import { getHabitStateForUser } from "../services/habitState.service";

const router= Router()

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
         const state = await getHabitStateForUser(process.env.EKAM_USER_ID!);
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