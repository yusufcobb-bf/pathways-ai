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

// Stage 28b: Choice card illustrations
export interface ChoiceIllustration {
  choiceId: string;
  imageUrl: string;
}

export interface StoryIllustrations {
  archetypeId: string;
  intro: SentenceIllustration[];
  checkpoints: CheckpointIllustration[];
  ending: SentenceIllustration[];
  choices?: ChoiceIllustration[]; // Stage 28b: Optional choice card images
}

/**
 * Story illustrations registry.
 * Stage 28: Populated with reusable theme-based images for science-fair-mystery.
 *
 * NOTE: Checkpoint beats use local indices (0-6) which map to intro array.
 * This is intentional MVP behavior - checkpoints reuse intro images.
 */
export const storyIllustrations: Record<string, StoryIllustrations> = {
  "science-fair-mystery": {
    archetypeId: "science-fair-mystery",
    intro: [
      // Intro beats (indices 0-9)
      // Note: Checkpoint beats also lookup intro[0-6] due to StoryPager behavior
      {
        sentenceIndex: 0,
        illustrationPrompt: "arriving at school",
        imageUrl: "/images/science-fair-mystery/student-searching.png",
      },
      {
        sentenceIndex: 1,
        illustrationPrompt: "excited about project",
        imageUrl: "/images/science-fair-mystery/student-concerned.png",
      },
      {
        sentenceIndex: 2,
        illustrationPrompt: "hallways echo",
        imageUrl: "/images/science-fair-mystery/gym-wide.png",
      },
      {
        sentenceIndex: 3,
        illustrationPrompt: "push through doors",
        imageUrl: "/images/science-fair-mystery/gym-wide.png",
      },
      {
        sentenceIndex: 4,
        illustrationPrompt: "something wrong",
        imageUrl: "/images/science-fair-mystery/broken-pieces.png",
      },
      {
        sentenceIndex: 5,
        illustrationPrompt: "empty table",
        imageUrl: "/images/science-fair-mystery/broken-pieces.png",
      },
      {
        sentenceIndex: 6,
        illustrationPrompt: "scattered pieces",
        imageUrl: "/images/science-fair-mystery/broken-pieces.png",
      },
      {
        sentenceIndex: 7,
        illustrationPrompt: "Kai searching",
        imageUrl: "/images/science-fair-mystery/student-searching.png",
      },
      {
        sentenceIndex: 8,
        illustrationPrompt: "Maya with paper",
        imageUrl: "/images/science-fair-mystery/two-students.png",
      },
      {
        sentenceIndex: 9,
        illustrationPrompt: "Mr. Rodriguez chairs",
        imageUrl: "/images/science-fair-mystery/classroom-setup.png",
      },
    ],
    checkpoints: [], // Empty - checkpoints use intro array via StoryPager mapping
    ending: [
      {
        sentenceIndex: 0,
        illustrationPrompt: "gym fills",
        imageUrl: "/images/science-fair-mystery/gym-wide.png",
      },
      {
        sentenceIndex: 1,
        illustrationPrompt: "Maya display",
        imageUrl: "/images/science-fair-mystery/two-students.png",
      },
      {
        sentenceIndex: 2,
        illustrationPrompt: "Kai helps",
        imageUrl: "/images/science-fair-mystery/two-students.png",
      },
      {
        sentenceIndex: 3,
        illustrationPrompt: "volcano demonstration",
        imageUrl: "/images/science-fair-mystery/classroom-setup.png",
      },
      {
        sentenceIndex: 4,
        illustrationPrompt: "Mr. Rodriguez notes",
        imageUrl: "/images/science-fair-mystery/classroom-setup.png",
      },
      {
        sentenceIndex: 5,
        illustrationPrompt: "morning unfolds",
        imageUrl: "/images/science-fair-mystery/gym-wide.png",
      },
    ],
    // Stage 28b: Choice card images
    choices: [
      { choiceId: "c1-a", imageUrl: "/images/science-fair-mystery/choice-c1-a.png" },
      { choiceId: "c1-b", imageUrl: "/images/science-fair-mystery/choice-c1-b.png" },
      { choiceId: "c1-c", imageUrl: "/images/science-fair-mystery/choice-c1-c.png" },
      { choiceId: "c2-a", imageUrl: "/images/science-fair-mystery/choice-c2-a.png" },
      { choiceId: "c2-b", imageUrl: "/images/science-fair-mystery/choice-c2-b.png" },
      { choiceId: "c3-a", imageUrl: "/images/science-fair-mystery/choice-c3-a.png" },
      { choiceId: "c3-b", imageUrl: "/images/science-fair-mystery/choice-c3-b.png" },
      { choiceId: "c3-c", imageUrl: "/images/science-fair-mystery/choice-c3-c.png" },
    ],
  },
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

/**
 * Stage 28b: Get pre-generated illustration URL for a choice card.
 * Returns undefined if no image exists (use gradient fallback).
 */
export function getChoiceImageUrl(
  archetypeId: string,
  choiceId: string
): string | undefined {
  const storyData = storyIllustrations[archetypeId];
  if (!storyData?.choices) return undefined;

  const match = storyData.choices.find((c) => c.choiceId === choiceId);
  return match?.imageUrl;
}
