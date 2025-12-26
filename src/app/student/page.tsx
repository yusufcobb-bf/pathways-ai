import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StoryPlayer from "@/components/StoryPlayer";
import { loadStoryPool } from "@/data/story";
import {
  getStoryPoolConfig,
  applyStoryPoolConfig,
  selectStoryByMode,
  selectStoryForShuffledMode,
} from "@/lib/story-config";
import { selectVariantForStory, variantToStory } from "@/data/variants";

export default async function StudentHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Count COMPLETED sessions for this user (where reflection exists)
  const { count } = await supabase
    .from("story_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("reflection", "is", null);

  const completedSessions = count ?? 0;

  // Load raw story pool
  const rawPool = loadStoryPool();

  // Fetch educator configuration (returns null if none exists)
  const config = await getStoryPoolConfig(supabase);

  // Stage 10: Apply config to get mode, filtered pool, and single story selection
  const { mode, configuredPool, singleStoryId } = applyStoryPoolConfig(
    rawPool,
    config
  );

  // Stage 16: Get guided reflection setting from config
  const guidedReflectionEnabled = config?.guided_reflection_enabled ?? false;

  // Use async function for shuffled_sequence mode (requires DB access for per-student state)
  const selectedEntry =
    mode === "shuffled_sequence"
      ? await selectStoryForShuffledMode(
          supabase,
          user.id,
          configuredPool,
          completedSessions
        )
      : selectStoryByMode(configuredPool, mode, completedSessions, singleStoryId);

  const { storyId, archetypeId, isGenerated } = selectedEntry;

  // Stage 8: Resolve variant for the selected archetype
  // Variant selection is deterministic based on completed sessions
  const variant = selectVariantForStory(archetypeId, completedSessions);
  const story = variantToStory(variant);
  const variantId = variant.variantId;

  // Key includes session count to force remount even if storyId unchanged (fixed mode)
  return (
    <>
      <div className="mb-6 flex justify-end gap-3">
        <Link
          href="/student/sessions"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Past Sessions
        </Link>
        <Link
          href="/student/classrooms"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          My Classrooms
        </Link>
      </div>
      <StoryPlayer
        key={`${storyId}-${completedSessions}`}
        story={story}
        storyId={storyId}
        archetypeId={archetypeId}
        variantId={variantId}
        isGenerated={isGenerated}
        guidedReflectionEnabled={guidedReflectionEnabled}
      />
    </>
  );
}
