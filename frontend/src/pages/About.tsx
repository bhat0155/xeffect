// src/pages/About.tsx
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  Flame,
  Lock,
  RefreshCcw,
  Sparkles,
  ExternalLink,
  BookOpen,
  ShieldCheck,
} from "lucide-react";

function StatCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-base-300 bg-base-200 p-2">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-base-content/70">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function RuleItem({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="mt-0.5 rounded-xl border border-base-300 bg-base-200 p-2">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="mt-1 text-sm text-base-content/70">{children}</div>
      </div>
    </li>
  );
}

export default function About() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      {/* Hero */}
      <section className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-200 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-4 w-4" />
              Simple, consistent, 21 days
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              About xeffect
            </h1>

            <p className="mt-3 max-w-2xl text-base text-base-content/70">
              xeffect is a lightweight 21-day habit tracker designed to make
              consistency visible. No complicated dashboards—just a clear grid,
              a streak, and daily check-ins.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/" className="btn btn-primary rounded-2xl">
                Back to Habits
              </Link>

              <a
                href="https://ekam.hashnode.dev/x-effect"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost rounded-2xl border border-base-300"
              >
                <BookOpen className="h-4 w-4" />
                Read the article
                <ExternalLink className="h-4 w-4 opacity-70" />
              </a>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:w-[320px]">
            <div className="rounded-2xl border border-base-300 bg-base-200 p-4">
              <div className="text-xs text-base-content/70">Core idea</div>
              <div className="mt-1 text-lg font-semibold">
                Don’t break the chain.
              </div>
              <div className="mt-2 text-sm text-base-content/70">
                One small action per day → visible momentum.
              </div>
            </div>
            <div className="rounded-2xl border border-base-300 bg-base-200 p-4">
              <div className="text-xs text-base-content/70">Best for</div>
              <div className="mt-1 text-sm">
                Gym • Coding • Reading • Meditation • Water • Sleep
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">How it works</h2>
        <p className="mt-2 text-sm text-base-content/70">
          Each habit is tracked across a 21-day grid. You check in once per day,
          and xeffect calculates your streak and progress automatically.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<CalendarDays className="h-5 w-5" />}
            title="21-day grid"
            desc="A simple visual system: Day 1 → Day 21. No extra noise."
          />
          <StatCard
            icon={<BadgeCheck className="h-5 w-5" />}
            title="Daily check-in"
            desc="Mark today as done when you complete the habit."
          />
          <StatCard
            icon={<Flame className="h-5 w-5" />}
            title="Streak-based motivation"
            desc="Your streak grows only with consecutive daily check-ins."
          />
        </div>
      </section>

      {/* Rules */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Rules of xeffect</h2>
        <p className="mt-2 text-sm text-base-content/70">
          The rules are intentionally strict to keep the tracker honest and
          momentum-focused.
        </p>

        <ul className="mt-5 grid gap-4">
          <RuleItem
            icon={<BadgeCheck className="h-5 w-5" />}
            title="1 check-in per day"
          >
            You can only complete the habit for the current day. No bulk-filling
            past days.
          </RuleItem>

          <RuleItem
            icon={<Flame className="h-5 w-5" />}
            title="Streak = consecutive completed days"
          >
            If you check in today and yesterday was completed, your streak
            increases. If yesterday wasn’t completed, your streak restarts.
          </RuleItem>

          <RuleItem
            icon={<RefreshCcw className="h-5 w-5" />}
            title="Missed day resets momentum"
          >
            If a day is missed, the chain breaks. You can continue the habit,
            but the streak starts again from 1 on your next completed day.
          </RuleItem>

          <RuleItem
            icon={<CalendarDays className="h-5 w-5" />}
            title="21 days is one cycle"
          >
            Once you complete Day 21, you’ve finished a full cycle. You can
            restart the cycle (fresh grid) to keep building consistency.
          </RuleItem>

          <RuleItem
            icon={<Lock className="h-5 w-5" />}
            title="Past days are locked (by design)"
          >
            This keeps progress trustworthy and prevents “fixing” history. If you
            want flexibility later, add an optional edit mode—but strict mode is
            the default.
          </RuleItem>
        </ul>
      </section>

      {/* Privacy */}
      <section className="mt-10 rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-base-300 bg-base-200 p-2">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Privacy</h2>
            <p className="mt-2 text-sm text-base-content/70">
              We don’t sell your data. Your habit data stays private and is
              handled securely.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-10 text-center text-xs text-base-content/50">
        Built for consistency. Designed to stay simple.
      </footer>
    </main>
  );
}