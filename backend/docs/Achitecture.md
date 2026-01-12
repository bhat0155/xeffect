# xeffect Backend Architecture

## HabitState (Response Contract)

All habit-related endpoints return a single, consistent response shape called `HabitState`.
Frontend renders ONLY what the backend sends.

### HabitState (success)
```ts
type HabitBox = {
  day: number;        // 1..21
  status: boolean;    // true = X is filled
  canEdit: boolean;   // true only for today's editable box
};

type HabitMeta = {
  id: string;
  name: string;
  bestStreak: number;
  allDone: boolean;
  isPublic: boolean;
  publicSlug: string | null;
};

type AiPayload = {
  milestoneDay: 1 | 3 | 7 | 14 | 21;
  message: string;
};

type HabitState = {
  habit: HabitMeta | null;   // null means no active habit yet
  todayUTC: string;          // "YYYY-MM-DD"
  checkedInToday: boolean;
  currentStreak: number;     // 0..21
  boxes: HabitBox[];         // length always 21
  ai?: AiPayload;            // optional
};