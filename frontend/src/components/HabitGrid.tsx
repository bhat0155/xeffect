// src/components/HabitGrid.tsx
import type { HabitBox } from "../types/habit";

type Props = {
  boxes: HabitBox[];
  readOnly?: boolean;
  onClickDay?: (day: number) => void;
};

export default function HabitGrid({ boxes, readOnly = true, onClickDay }: Props) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {boxes.map((b) => {
        const isDone = b.status;
        const isClickable = !readOnly && b.canEdit && !!onClickDay;

        // Borders:
        // - Light mode: always black borders
        // - Dark mode:
        //    - done => green border
        //    - not done => white border
        const borderClass = isDone
          ? "border-2 border-black dark:border-success"
          : "border-2 border-black dark:border-white";

        const className = [
          "aspect-square rounded-xl flex items-center justify-center text-sm font-semibold select-none transition",
          borderClass,
          isDone ? "bg-success text-success-content" : "bg-base-100",
          b.canEdit && !readOnly ? "ring-2 ring-primary" : "",
          isClickable ? "cursor-pointer hover:opacity-90" : "cursor-not-allowed opacity-80",
        ].join(" ");

        return (
          <button
            key={b.day}
            type="button"
            className={className}
            disabled={!isClickable}
            onClick={() => onClickDay?.(b.day)}
            aria-label={`Day ${b.day}`}
          >
            {/* Done => show X, otherwise show day number */}
            {isDone ? "X" : b.day}
          </button>
        );
      })}
    </div>
  );
}