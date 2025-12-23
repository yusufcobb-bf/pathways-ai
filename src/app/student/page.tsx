import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoryPlayer from "@/components/StoryPlayer";
import { loadStory } from "@/data/story";

export default async function StudentHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Load the story (generated or fallback)
  const { story, storyId, isGenerated } = loadStory();

  return (
    <StoryPlayer story={story} storyId={storyId} isGenerated={isGenerated} />
  );
}
