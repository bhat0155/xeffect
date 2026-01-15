import { addDaysUTC } from "../utils/utc";
import { computeEngineState } from "../engine/streakEngine";

function boxesToMap(boxes: { day: number; status: boolean; canEdit: boolean }[]) {
  const map = new Map<number, { status: boolean; canEdit: boolean }>();
  for (const b of boxes) map.set(b.day, { status: b.status, canEdit: b.canEdit });
  return map;
}

describe("streakEngine (computeEngineState)", () => {
  const todayUTC = "2026-01-15";
  const yesterdayUTC = "2026-01-14";

  test("1) No checkins -> streak 0, day1 editable", () => {
    const res = computeEngineState({
      todayUTC,
      yesterdayUTC,
      checkinSet: new Set(),
      allDone: false,
    });

    expect(res.checkedInToday).toBe(false);
    expect(res.currentStreak).toBe(0);
    expect(res.boxes).toHaveLength(21);

    const m = boxesToMap(res.boxes);
    expect(m.get(1)?.status).toBe(false);
    expect(m.get(1)?.canEdit).toBe(true);
    expect(m.get(2)?.canEdit).toBe(false);
  });

  test("2) Checkin today only -> checkedInToday true, streak 1, no canEdit", () => {
    const res = computeEngineState({
      todayUTC,
      yesterdayUTC,
      checkinSet: new Set([todayUTC]),
      allDone: false,
    });

    expect(res.checkedInToday).toBe(true);
    expect(res.currentStreak).toBe(1);

    const m = boxesToMap(res.boxes);
    expect(m.get(1)?.status).toBe(true);

    // All canEdit must be false when checked in today
    for (const b of res.boxes) expect(b.canEdit).toBe(false);
  });

  test("3) Checkin yesterday only -> checkedInToday false, streak 1, day2 editable", () => {
    const res = computeEngineState({
      todayUTC,
      yesterdayUTC,
      checkinSet: new Set([yesterdayUTC]),
      allDone: false,
    });

    expect(res.checkedInToday).toBe(false);
    expect(res.currentStreak).toBe(1);

    const m = boxesToMap(res.boxes);
    expect(m.get(1)?.status).toBe(true);
    expect(m.get(2)?.status).toBe(false);
    expect(m.get(2)?.canEdit).toBe(true);
    expect(m.get(1)?.canEdit).toBe(false);
  });

  test("4) Checkin today + yesterday -> streak 2, no canEdit (checkedInToday true)", () => {
    const res = computeEngineState({
      todayUTC,
      yesterdayUTC,
      checkinSet: new Set([todayUTC, yesterdayUTC]),
      allDone: false,
    });

    expect(res.checkedInToday).toBe(true);
    expect(res.currentStreak).toBe(2);

    const m = boxesToMap(res.boxes);
    expect(m.get(1)?.status).toBe(true);
    expect(m.get(2)?.status).toBe(true);
    expect(m.get(3)?.status).toBe(false);

    for (const b of res.boxes) expect(b.canEdit).toBe(false);
  });

  test("5) Miss yesterday but checkin today -> streak becomes 1", () => {
    const twoDaysAgo = addDaysUTC(todayUTC, -2);

    const res = computeEngineState({
      todayUTC,
      yesterdayUTC,
      checkinSet: new Set([todayUTC, twoDaysAgo]), // yesterday missing
      allDone: false,
    });

    expect(res.checkedInToday).toBe(true);
    expect(res.currentStreak).toBe(1);
  });

  test("6) allDone=true -> canEdit must be false everywhere (even if not checked in today)", () => {
    const res = computeEngineState({
      todayUTC,
      yesterdayUTC,
      checkinSet: new Set([yesterdayUTC]), // would normally make day2 editable
      allDone: true,
    });

    expect(res.checkedInToday).toBe(false);
    expect(res.currentStreak).toBe(1);

    for (const b of res.boxes) expect(b.canEdit).toBe(false);
  });

  test("7) Cap at 21 even if more consecutive checkins exist", () => {
    // build 30 consecutive dates ending today
    const set = new Set<string>();
    for (let i = 0; i < 30; i++) set.add(addDaysUTC(todayUTC, -i));

    const res = computeEngineState({
      todayUTC,
      yesterdayUTC,
      checkinSet: set,
      allDone: false,
    });

    expect(res.checkedInToday).toBe(true);
    expect(res.currentStreak).toBe(21);
    expect(res.boxes).toHaveLength(21);

    // day21 status true, and no canEdit because checkedInToday true
    const m = boxesToMap(res.boxes);
    expect(m.get(21)?.status).toBe(true);
    for (const b of res.boxes) expect(b.canEdit).toBe(false);
  });
});