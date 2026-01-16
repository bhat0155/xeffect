import { Router } from "express";
import {prisma} from "../config/prisma"
import { getHabitStateForUser } from "../services/habitState.service";
import { getTodayUTCDate } from "../utils/utc";

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
      const emptyState = {
        habit: null,
        todayUTC: getTodayUTCDate(),
        checkedInToday: false,
        currentStreak: 0,
        boxes: Array.from({ length: 21 }, (_, i) => ({
          day: i + 1,
          status: false,
          canEdit: false,
        })),
      };
      return res.status(200).json(emptyState);
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
