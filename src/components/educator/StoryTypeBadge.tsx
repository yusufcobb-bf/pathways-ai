import { VisualBeatStory } from "@/data/story";

/**
 * Stage 38: Story type badge for educator pages.
 * Renders "Diagnostic Assessment" or "Skill Training: {virtue}" badge.
 */
export function StoryTypeBadge({ story }: { story: VisualBeatStory }) {
  if (story.storyType === "diagnostic") {
    return (
      <span
        title="This story is used to assess students before training"
        className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
      >
        Diagnostic Assessment
      </span>
    );
  }

  if (story.storyType === "training" && story.focusedVirtue) {
    return (
      <span
        title="This story is used for focused skill practice"
        className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
      >
        Skill Training: {story.focusedVirtue}
      </span>
    );
  }

  return null;
}
