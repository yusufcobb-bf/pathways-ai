import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoryPlayer from "@/components/StoryPlayer";
import { loadStoryPool } from "@/data/story";
import {
  getStoryPoolConfig,
  applyConfigToPool,
  selectStoryByMode,
} from "@/lib/story-config";

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

  // Apply config to filter and order the pool
  const configuredPool = applyConfigToPool(rawPool, config);

  // Select story based on mode (defaults to fixed_sequence if no config)
  const mode = config?.mode ?? "fixed_sequence";
  const { story, storyId, isGenerated } = selectStoryByMode(
    configuredPool,
    mode,
    completedSessions
  );

  // Key includes session count to force remount even if storyId unchanged (fixed mode)
  return (
    <StoryPlayer key={`${storyId}-${completedSessions}`} story={story} storyId={storyId} isGenerated={isGenerated} />
  );
}
