/**
 * Stage 25: Comic Illustrations Data Layer
 *
 * Per-story illustration metadata storage.
 * Phase 1: No actual images - uses gradient fallbacks.
 * Image URLs can be added here later for pre-generated images.
 */

export interface SentenceIllustration {
  sentenceIndex: number;
  illustrationPrompt: string;
  imageUrl?: string; // Optional: pre-generated image URL
}

export interface CheckpointIllustration {
  checkpointId: string;
  illustrationPrompt: string;
  imageUrl?: string; // Optional: pre-generated image URL
}

export interface StoryIllustrations {
  archetypeId: string;
  intro: SentenceIllustration[];
  checkpoints: CheckpointIllustration[];
  ending: SentenceIllustration[];
}

/**
 * Story illustrations registry.
 * Phase 1: Empty - illustrations are generated dynamically.
 * Future: Can be populated with pre-generated image URLs.
 */
export const storyIllustrations: Record<string, StoryIllustrations> = {
  // Example structure for future use:
  // "community-garden-discovery": {
  //   archetypeId: "community-garden-discovery",
  //   intro: [
  //     { sentenceIndex: 0, illustrationPrompt: "...", imageUrl: "/comic/cgd/intro-0.png" },
  //   ],
  //   checkpoints: [
  //     { checkpointId: "c1", illustrationPrompt: "...", imageUrl: "/comic/cgd/cp-0.png" },
  //   ],
  //   ending: [
  //     { sentenceIndex: 0, illustrationPrompt: "...", imageUrl: "/comic/cgd/end-0.png" },
  //   ],
  // },
};

/**
 * Get pre-generated illustration URL for a sentence panel.
 * Returns undefined if no pre-generated image exists (use gradient fallback).
 */
export function getSentenceImageUrl(
  archetypeId: string,
  stage: "intro" | "ending",
  sentenceIndex: number
): string | undefined {
  const storyData = storyIllustrations[archetypeId];
  if (!storyData) return undefined;

  const illustrations = stage === "intro" ? storyData.intro : storyData.ending;
  const match = illustrations.find((ill) => ill.sentenceIndex === sentenceIndex);
  return match?.imageUrl;
}

/**
 * Get pre-generated illustration URL for a decision/checkpoint panel.
 * Returns undefined if no pre-generated image exists (use gradient fallback).
 */
export function getCheckpointImageUrl(
  archetypeId: string,
  checkpointId: string
): string | undefined {
  const storyData = storyIllustrations[archetypeId];
  if (!storyData) return undefined;

  const match = storyData.checkpoints.find(
    (ill) => ill.checkpointId === checkpointId
  );
  return match?.imageUrl;
}
