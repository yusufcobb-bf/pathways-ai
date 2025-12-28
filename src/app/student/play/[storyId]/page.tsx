/**
 * Stage 41: Story Play Page
 *
 * Dedicated page for playing a specific story.
 * Students navigate here from the Student Home story grid.
 *
 * CHECK D compliance:
 * - guidedReflectionEnabled=false only disables optional guided prompts
 * - Base reflection textarea always appears after story completion
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoryPlayer from "@/components/StoryPlayer";
import { getStoryFromPool, isVisualBeatStory } from "@/data/story";
import { selectVariantForStory, variantToStory } from "@/data/variants";

interface PageProps {
  params: Promise<{ storyId: string }>;
}

export default async function PlayStoryPage({ params }: PageProps) {
  const { storyId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Auth check
  if (!user) {
    redirect("/login");
  }

  // Load story from pool
  const poolEntry = getStoryFromPool(storyId);

  // Story not found - redirect to Student Home
  if (!poolEntry) {
    redirect("/student");
  }

  // Count completed sessions for variant selection (prose stories only)
  const { count } = await supabase
    .from("story_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("reflection", "is", null);

  const completedSessions = count ?? 0;

  // Determine story and variant
  let story = poolEntry.story;
  let variantId: string | null = null;

  // Only prose stories use variants - visual beat stories are used directly
  if (!isVisualBeatStory(poolEntry.story)) {
    const variant = selectVariantForStory(poolEntry.archetypeId, completedSessions);
    variantId = variant.variantId;
    story = variantToStory(variant);
  }

  // MVP: guidedReflectionEnabled=false (guided prompts disabled)
  // CHECK D: Base reflection textarea still appears regardless
  const guidedReflectionEnabled = false;

  return (
    <StoryPlayer
      key={`${storyId}-${completedSessions}`}
      story={story}
      storyId={storyId}
      archetypeId={poolEntry.archetypeId}
      variantId={variantId}
      isGenerated={poolEntry.isGenerated}
      guidedReflectionEnabled={guidedReflectionEnabled}
      assignmentId={null}
    />
  );
}
