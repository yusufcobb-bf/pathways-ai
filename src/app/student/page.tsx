/**
 * Stage 41: Student Home
 *
 * Displays a browsable grid of story cards.
 * Students can select any story to play directly.
 *
 * Replaces the previous auto-play behavior with explicit story selection.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadStoryPool } from "@/data/story";
import StoryGrid from "@/components/student/StoryGrid";

export default async function StudentHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Auth check
  if (!user) {
    redirect("/login");
  }

  // Load all stories in the pool
  const pool = loadStoryPool();

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">
            Choose a Story
          </h1>
          <p className="text-zinc-600">
            Select a story to begin your adventure.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/student/progress"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            My Progress
          </Link>
          <Link
            href="/student/sessions"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Past Sessions
          </Link>
          {/* Stage 41: Assignments and Classrooms links removed for MVP */}
        </div>
      </div>

      {/* Story Grid */}
      <StoryGrid stories={pool} />
    </div>
  );
}
