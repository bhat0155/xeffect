import request from "supertest";
import jwt from "jsonwebtoken";

import { app } from "../app";
import { prisma } from "../config/prisma";

export function makeAuthCookie(userId: string) {
  const secret = process.env.JWT_SECRET!;
  const token = jwt.sign({ userId }, secret, { expiresIn: "1hr" });
  return `xeffect_token=${token}`;
}

describe("Auth Protection", () => {
  beforeEach(async () => {
    await prisma.habitCheckin.deleteMany({});
    await prisma.habit.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /api/habits/me returns 401 when not logged in", async () => {
    const res = await request(app).get("/api/habits/me");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("code");
    expect(res.body).toHaveProperty("message");
  });

  it("GET /api/habits/me returns 200 when user is logged in", async () => {
    const cookie = makeAuthCookie("test-user-ekam");

    const res = await request(app)
      .get("/api/habits/me")
      .set("Cookie", [cookie]);

    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty("habit", null);
    expect(res.body).toHaveProperty("todayUTC");
    expect(res.body).toHaveProperty("checkedInToday", false);
    expect(res.body).toHaveProperty("currentStreak", 0);

    expect(Array.isArray(res.body.boxes)).toBe(true);
    expect(res.body.boxes).toHaveLength(21);

    // Day 1 should be editable in empty state
    expect(res.body.boxes[0]).toMatchObject({
      day: 1,
      status: false,
      canEdit: true,
    });
  });

  it(
    "POST /api/habits/:id/save creates today's checkin and is idempotent",
    async () => {
      const userId = "test-user-ekam";
      const cookie = makeAuthCookie(userId);

      //Create user FIRST (Habit has FK -> User)
      await prisma.user.create({
        data: {
          id: userId,
          email: `test+${userId}@example.com`,
          name: "Test User",
          googleId: "google-test-id",
        },
      });

      // 1) Create habit
      const createRes = await request(app)
        .post("/api/habits")
        .set("Cookie", [cookie])
        .send({ name: "cold showers" });

      expect(createRes.status).toBe(201);
      expect(createRes.body).toHaveProperty("habit");
      expect(createRes.body.habit).toHaveProperty("id");

      const habitId = createRes.body.habit.id as string;

      // 2) Save today (first time)
      const saveRes1 = await request(app)
        .post(`/api/habits/${habitId}/save`)
        .set("Cookie", [cookie]);

      expect(saveRes1.status).toBe(201);
      expect(saveRes1.body).toHaveProperty("checkedInToday", true);
      expect(saveRes1.body).toHaveProperty("currentStreak", 1);

      expect(saveRes1.body.boxes[0]).toMatchObject({
        day: 1,
        status: true,
        canEdit: false,
      });

      // DB should have exactly one checkin
      const count1 = await prisma.habitCheckin.count({ where: { habitId } });
      expect(count1).toBe(1);

      // 3) Save today again (idempotent)
      const saveRes2 = await request(app)
        .post(`/api/habits/${habitId}/save`)
        .set("Cookie", [cookie]);

      expect(saveRes2.status).toBe(201);
      expect(saveRes2.body).toHaveProperty("checkedInToday", true);
      expect(saveRes2.body).toHaveProperty("currentStreak", 1);

      // Still only 1 row in DB
      const count2 = await prisma.habitCheckin.count({ where: { habitId } });
      expect(count2).toBe(1);
    },
    15000
  );
});