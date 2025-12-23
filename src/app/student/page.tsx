import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoryPlayer from "@/components/StoryPlayer";
import { loadStoryPool } from "@/data/story";

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

  // Calculate which story to show (round-robin through story pool)
  const completedSessions = count ?? 0;
  const pool = loadStoryPool();
  const storyIndex = completedSessions % pool.length;

  // Get the selected story from pool
  const { story, storyId, isGenerated } = pool[storyIndex];

  return (
    <StoryPlayer story={story} storyId={storyId} isGenerated={isGenerated} />
  );
}
