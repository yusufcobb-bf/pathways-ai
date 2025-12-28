/**
 * Stage 41: StoryGrid Component
 *
 * Renders a responsive grid of StoryCard components for the Student Home.
 * Extracts storyType and focusedVirtue directly from story metadata.
 *
 * CHECK E compliance:
 * - Reads metadata directly from story objects
 * - No hardcoding or inference of virtue labels
 */

import { StoryPoolEntry, isVisualBeatStory } from "@/data/story";
import type { VisualBeatStory } from "@/data/visual-story";
import StoryCard from "./StoryCard";

interface StoryGridProps {
  stories: StoryPoolEntry[];
}

export default function StoryGrid({ stories }: StoryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {stories.map((entry) => {
        // Extract metadata from visual beat stories
        // CHECK E: Read directly from story metadata, no inference
        let storyType: "diagnostic" | "training" | undefined;
        let focusedVirtue: string | undefined;

        if (isVisualBeatStory(entry.story)) {
          const visualStory = entry.story as VisualBeatStory;
          storyType = visualStory.storyType;
          focusedVirtue = visualStory.focusedVirtue;
        }

        return (
          <StoryCard
            key={entry.storyId}
            storyId={entry.storyId}
            archetypeId={entry.archetypeId}
            title={entry.story.title}
            storyType={storyType}
            focusedVirtue={focusedVirtue}
          />
        );
      })}
    </div>
  );
}
