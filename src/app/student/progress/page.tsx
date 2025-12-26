import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VIRTUES } from "@/data/virtues";

// Calculate distinct weeks with activity
function countActiveWeeks(sessions: { created_at: string }[]): number {
  if (!sessions || sessions.length === 0) return 0;
  const weeks = new Set<string>();
  for (const s of sessions) {
    const date = new Date(s.created_at);
    const year = date.getFullYear();
    const week = Math.floor(
      (date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    weeks.add(`${year}-W${week}`);
  }
  return weeks.size;
}

// Get virtue trend label based on cumulative value
function getVirtueTrendLabel(value: number): { label: string; icon: string; color: string } {
  if (value > 10) {
    return { label: "Growing", icon: "\u2191", color: "text-green-600" };
  } else if (value < -10) {
    return { label: "Emerging", icon: "\u00B7", color: "text-zinc-500" };
  } else {
    return { label: "Steady", icon: "\u2192", color: "text-blue-600" };
  }
}

// Normalize raw virtue value to 0-100 scale (50 = neutral baseline)
function normalizeVirtueValue(raw: number): number {
  return Math.max(0, Math.min(100, 50 + raw));
}

export default async function StudentProgressPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch student progress - handle no rows gracefully
  const { data: progress } = await supabase
    .from("student_progress")
    .select("*")
    .eq("student_id", user.id)
    .maybeSingle();

  // Default values if no progress row exists yet
  const xp = progress?.xp ?? 0;
  const level = progress?.level ?? 1;
  const xpInCurrentLevel = xp % 100;
  const xpToNextLevel = 100;
  const xpForNextLevel = level * 100;

  // Fetch virtue trends - empty array if none
  const { data: trends } = await supabase
    .from("student_virtue_trends")
    .select("*")
    .eq("student_id", user.id);

  const virtueTrends = trends ?? [];

  // Build virtue map for display
  const virtueMap = new Map<string, number>();
  for (const trend of virtueTrends) {
    virtueMap.set(trend.virtue_id, trend.value);
  }

  // Calculate streak from story_sessions
  const { data: sessions } = await supabase
    .from("story_sessions")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const activeWeeks = countActiveWeeks(sessions ?? []);

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">My Progress</h1>
          <p className="text-zinc-600">Your personal growth journey.</p>
        </div>
        <Link
          href="/student"
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          &larr; Back to Stories
        </Link>
      </div>

      {/* Level & XP Card */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Level {level}</h2>
          <span className="text-sm text-zinc-500">
            {xp} / {xpForNextLevel} XP
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-300"
            style={{ width: `${(xpInCurrentLevel / xpToNextLevel) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {xpToNextLevel - xpInCurrentLevel} XP until next level
        </p>
      </div>

      {/* Virtue Growth Card */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="font-semibold text-zinc-900">Virtue Growth</h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          {VIRTUES.map((virtue) => {
            const value = virtueMap.get(virtue) ?? 0;
            const trend = getVirtueTrendLabel(value);
            const displayValue = normalizeVirtueValue(value);
            return (
              <li
                key={virtue}
                className="flex items-center justify-between px-6 py-3"
              >
                <span className="text-sm text-zinc-900">{virtue}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-700">
                    {displayValue} / 100
                  </span>
                  <span className={`text-sm ${trend.color}`}>
                    {trend.label} {trend.icon}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Streak Indicator */}
      {activeWeeks > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            You&apos;ve been active for{" "}
            <span className="font-medium text-zinc-900">
              {activeWeeks} {activeWeeks === 1 ? "week" : "weeks"}
            </span>
          </p>
        </div>
      )}

      {/* Empty state for new students */}
      {xp === 0 && activeWeeks === 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
          <p className="text-zinc-500">
            Complete your first story to start tracking your progress!
          </p>
          <Link
            href="/student"
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Play a Story
          </Link>
        </div>
      )}
    </div>
  );
}
