import { Router } from "express";
import {prisma} from "../config/prisma"
import { getHabitStateForUser } from "../services/habitState.service";

const router= Router()

// public route to get habit state by public slug
router.get("/:publicSlug", async (req, res, next) => {
  try {
    const publicSlug = (req.params.publicSlug ?? "").trim();
    if (!publicSlug) {
      return res
        .status(400)
        .json({ code: "VALIDATION_ERROR", message: "Public slug is required" });
    }

    const habit = await prisma.habit.findFirst({
      where: { publicSlug, isPublic: true },
      select: { userId: true, id: true, name: true },
    });

    if (!habit) {
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Public habit not found" });
    }

    const state = await getHabitStateForUser(habit.userId);
    const readOnlyState = {
      ...state,
      boxes: state.boxes.map((item) => ({
        ...item,
        canEdit: false,
      })),
    };

    res.status(200).json(readOnlyState);
  } catch (err) {
    next(err);
  }
});

export default router
