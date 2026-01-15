import "dotenv/config";
import { prisma } from "../config/prisma";
import { getTodayUTCDate, addDaysUTC } from "../utils/utc";

// ✅ choose which scenario you want to seed
type Scenario = "STREAK_5_ENDING_TODAY" | "MISS_YESTERDAY" | "ONLY_TODAY" | "COMPLETE_21";
const SCENARIO: Scenario = "COMPLETE_21";

// Convert "YYYY-MM-DD" -> Date at UTC midnight (matches @db.Date behavior)
function toUtcMidnight(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function buildDatesForScenario(todayUTC: string, scenario: Scenario): string[] {
  if (scenario === "STREAK_5_ENDING_TODAY") {
    // today, yesterday, -2, -3, -4  => streak should compute as 5
    return Array.from({ length: 5 }, (_, i) => addDaysUTC(todayUTC, -i));
  }

  if (scenario === "MISS_YESTERDAY") {
    // checked today, missed yesterday, checked -2
    // streak should compute as 1 (because yesterday missing stops)
    return [todayUTC, addDaysUTC(todayUTC, -2)];
  }

  if (scenario === "ONLY_TODAY") {
    // streak should compute as 1
    return [todayUTC];
  }

  // COMPLETE_21
  // 21 consecutive days ending today => streak 21
  return Array.from({ length: 21 }, (_, i) => addDaysUTC(todayUTC, -i));
}

async function main() {
  console.log("✅ seed: start");

  // 1) upsert user (same as you already did)
  const user = await prisma.user.upsert({
    where: { email: "ekam@test.local" },
    update: {},
    create: {
      email: "ekam@test.local",
      name: "Ekam Seed",
      googleId: "seed-google-id-ekam",
    },
    select: { id: true },
  });

  // 2) delete old habit + recreate (clean slate)
  await prisma.habit.deleteMany({ where: { userId: user.id } });

  const habit = await prisma.habit.create({
    data: {
      userId: user.id,
      name: "Seed Habit",
      isPublic: true,
      publicSlug: "ekam-xeffect",
    },
    select: { id: true },
  });

  // 3) delete old checkins for that habit (clean slate)
  await prisma.habitCheckin.deleteMany({ where: { habitId: habit.id } });

  // 4) create checkins for selected scenario
  const todayUTC = getTodayUTCDate();
  const dates = buildDatesForScenario(todayUTC, SCENARIO);

  await prisma.habitCheckin.createMany({
    data: dates.map((d) => ({
      habitId: habit.id,
      checkinDate: toUtcMidnight(d),
    })),
    skipDuplicates: true, // respects your unique(habitId, checkinDate)
  });

  console.log(`✅ seed: created habit ${habit.id}`);
  console.log(`✅ seed: scenario=${SCENARIO}`);
  console.log(`✅ seed: inserted ${dates.length} checkins ending at ${todayUTC}`);
  console.log("✅ seed: done");
}

main()
  .catch((err) => {
    console.error("❌ seed error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });