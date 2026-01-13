import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { getHabitStateForUser } from "../services/habitState.service";

const router = Router();

// Protected route to get habit state for authenticated user
router.get("/me", requireAuth, async (req,res)=>{
    const userId = req.userId as string;
    const state = await getHabitStateForUser(userId);
    res.status(200).json({state})
})

export default router;