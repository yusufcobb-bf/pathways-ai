import { redirect } from "next/navigation";
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
    <StoryPlayer
      key={`${storyId}-${completedSessions}`}
      story={story}
      storyId={storyId}
      archetypeId={archetypeId}
      variantId={variantId}
      isGenerated={isGenerated}
    />
  );
}
