import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StoryPlayer from "@/components/StoryPlayer";
import { loadStoryPool, isVisualBeatStory, getStoryFromPool } from "@/data/story";
import {
  getStoryPoolConfig,
  applyStoryPoolConfig,
  selectStoryByMode,
  selectStoryForShuffledMode,
} from "@/lib/story-config";
import { selectVariantForStory, variantToStory, loadVariantsForArchetype } from "@/data/variants";

interface PageProps {
  searchParams: Promise<{
    assignmentId?: string;
    archetypeId?: string;
    variantId?: string;
    guidedReflection?: string;
  }>;
}

export default async function StudentHome({ searchParams }: PageProps) {
  const params = await searchParams;
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

  // Stage 22: Check if this is an assignment launch
  const isAssignmentLaunch = params.assignmentId && params.archetypeId;
  let assignmentId: string | null = null;
  let storyId: string;
  let archetypeId: string;
  let variantId: string | null = null;
  let isGenerated: boolean;
  let guidedReflectionEnabled: boolean;

  if (isAssignmentLaunch) {
    // Assignment launch - use provided params
    assignmentId = params.assignmentId!;
    archetypeId = params.archetypeId!;
    storyId = archetypeId; // For assignments, storyId = archetypeId
    isGenerated = false; // Assignments use known archetypes

    // Handle variant selection
    if (params.variantId) {
      // Specific variant requested - find it
      const variants = loadVariantsForArchetype(archetypeId);
      const requestedVariant = variants.find((v) => v.variantId === params.variantId);
      variantId = requestedVariant?.variantId ?? null;
    } else {
      // No specific variant - use default selection
      const variant = selectVariantForStory(archetypeId, completedSessions);
      variantId = variant.variantId;
    }

    // Handle guided reflection override
    // If guidedReflection param present: "1" = on, "0" = off
    // If not present (null override): use global config
    if (params.guidedReflection !== undefined) {
      guidedReflectionEnabled = params.guidedReflection === "1";
    } else {
      // Use global config as default
      const config = await getStoryPoolConfig(supabase);
      guidedReflectionEnabled = config?.guided_reflection_enabled ?? false;
    }
  } else {
    // Normal story selection flow
    const rawPool = loadStoryPool();
    const config = await getStoryPoolConfig(supabase);
    const { mode, configuredPool, singleStoryId } = applyStoryPoolConfig(rawPool, config);
    guidedReflectionEnabled = config?.guided_reflection_enabled ?? false;

    const selectedEntry =
      mode === "shuffled_sequence"
        ? await selectStoryForShuffledMode(supabase, user.id, configuredPool, completedSessions)
        : selectStoryByMode(configuredPool, mode, completedSessions, singleStoryId);

    storyId = selectedEntry.storyId;
    archetypeId = selectedEntry.archetypeId;
    isGenerated = selectedEntry.isGenerated;

    // Only select variants for prose stories - visual beat stories don't use variants
    if (!isVisualBeatStory(selectedEntry.story)) {
      const variant = selectVariantForStory(archetypeId, completedSessions);
      variantId = variant.variantId;
    }
  }

  // Stage 27: Get the story for StoryPlayer
  // Visual beat stories are used directly; prose stories go through variant system
  const poolEntry = getStoryFromPool(archetypeId);
  let story;

  if (poolEntry && isVisualBeatStory(poolEntry.story)) {
    // Visual beat story - use directly (no variant system)
    story = poolEntry.story;
    variantId = null; // Visual beat stories don't have variants
  } else {
    // Prose story - use variant system
    const variant = selectVariantForStory(archetypeId, completedSessions);
    // If we have a specific variantId from assignment, find that variant instead
    let finalVariant = variant;
    if (variantId && variantId !== variant.variantId) {
      const variants = loadVariantsForArchetype(archetypeId);
      const found = variants.find((v) => v.variantId === variantId);
      if (found) finalVariant = found;
    }
    story = variantToStory(finalVariant);
  }

  // Key includes session count to force remount even if storyId unchanged (fixed mode)
  return (
    <>
      <div className="mb-6 flex justify-end gap-3">
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
        <Link
          href="/student/assignments"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Assignments
        </Link>
        <Link
          href="/student/classrooms"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          My Classrooms
        </Link>
      </div>
      <StoryPlayer
        key={`${storyId}-${completedSessions}${assignmentId ? `-${assignmentId}` : ""}`}
        story={story}
        storyId={storyId}
        archetypeId={archetypeId}
        variantId={variantId}
        isGenerated={isGenerated}
        guidedReflectionEnabled={guidedReflectionEnabled}
        assignmentId={assignmentId}
      />
    </>
  );
}
