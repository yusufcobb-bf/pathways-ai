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
  checkpointBeats?: Record<string, SentenceIllustration[]>; // Stage 28c: Per-checkpoint beat images
  choices?: ChoiceIllustration[]; // Stage 28b: Optional choice card images
}

/**
 * Story illustrations registry.
 * Stage 28c: All 35 beats use unique images for science-fair-mystery.
 */
export const storyIllustrations: Record<string, StoryIllustrations> = {
  "science-fair-mystery": {
    archetypeId: "science-fair-mystery",
    // Intro: 10 beats (indices 0-9)
    intro: [
      { sentenceIndex: 0, illustrationPrompt: "arriving at school", imageUrl: "/images/science-fair-mystery/beat-intro-00.png" },
      { sentenceIndex: 1, illustrationPrompt: "excited about project", imageUrl: "/images/science-fair-mystery/beat-intro-01.png" },
      { sentenceIndex: 2, illustrationPrompt: "hallways echo", imageUrl: "/images/science-fair-mystery/beat-intro-02.png" },
      { sentenceIndex: 3, illustrationPrompt: "push through doors", imageUrl: "/images/science-fair-mystery/beat-intro-03.png" },
      { sentenceIndex: 4, illustrationPrompt: "something wrong", imageUrl: "/images/science-fair-mystery/beat-intro-04.png" },
      { sentenceIndex: 5, illustrationPrompt: "empty table", imageUrl: "/images/science-fair-mystery/beat-intro-05.png" },
      { sentenceIndex: 6, illustrationPrompt: "scattered pieces", imageUrl: "/images/science-fair-mystery/beat-intro-06.png" },
      { sentenceIndex: 7, illustrationPrompt: "Kai searching", imageUrl: "/images/science-fair-mystery/beat-intro-07.png" },
      { sentenceIndex: 8, illustrationPrompt: "Maya with paper", imageUrl: "/images/science-fair-mystery/beat-intro-08.png" },
      { sentenceIndex: 9, illustrationPrompt: "Mr. Rodriguez chairs", imageUrl: "/images/science-fair-mystery/beat-intro-09.png" },
    ],
    checkpoints: [],
    // Ending: 6 beats (indices 0-5)
    ending: [
      { sentenceIndex: 0, illustrationPrompt: "gym fills", imageUrl: "/images/science-fair-mystery/beat-ending-00.png" },
      { sentenceIndex: 1, illustrationPrompt: "Maya display", imageUrl: "/images/science-fair-mystery/beat-ending-01.png" },
      { sentenceIndex: 2, illustrationPrompt: "Kai helps", imageUrl: "/images/science-fair-mystery/beat-ending-02.png" },
      { sentenceIndex: 3, illustrationPrompt: "volcano demonstration", imageUrl: "/images/science-fair-mystery/beat-ending-03.png" },
      { sentenceIndex: 4, illustrationPrompt: "Mr. Rodriguez notes", imageUrl: "/images/science-fair-mystery/beat-ending-04.png" },
      { sentenceIndex: 5, illustrationPrompt: "morning unfolds", imageUrl: "/images/science-fair-mystery/beat-ending-05.png" },
    ],
    // Stage 28c: Per-checkpoint beat images
    checkpointBeats: {
      // c1: 7 beats (indices 0-6)
      c1: [
        { sentenceIndex: 0, illustrationPrompt: "c1 beat 0", imageUrl: "/images/science-fair-mystery/beat-c1-00.png" },
        { sentenceIndex: 1, illustrationPrompt: "c1 beat 1", imageUrl: "/images/science-fair-mystery/beat-c1-01.png" },
        { sentenceIndex: 2, illustrationPrompt: "c1 beat 2", imageUrl: "/images/science-fair-mystery/beat-c1-02.png" },
        { sentenceIndex: 3, illustrationPrompt: "c1 beat 3", imageUrl: "/images/science-fair-mystery/beat-c1-03.png" },
        { sentenceIndex: 4, illustrationPrompt: "c1 beat 4", imageUrl: "/images/science-fair-mystery/beat-c1-04.png" },
        { sentenceIndex: 5, illustrationPrompt: "c1 beat 5", imageUrl: "/images/science-fair-mystery/beat-c1-05.png" },
        { sentenceIndex: 6, illustrationPrompt: "c1 beat 6", imageUrl: "/images/science-fair-mystery/beat-c1-06.png" },
      ],
      // c2: 6 beats (indices 0-5)
      c2: [
        { sentenceIndex: 0, illustrationPrompt: "c2 beat 0", imageUrl: "/images/science-fair-mystery/beat-c2-00.png" },
        { sentenceIndex: 1, illustrationPrompt: "c2 beat 1", imageUrl: "/images/science-fair-mystery/beat-c2-01.png" },
        { sentenceIndex: 2, illustrationPrompt: "c2 beat 2", imageUrl: "/images/science-fair-mystery/beat-c2-02.png" },
        { sentenceIndex: 3, illustrationPrompt: "c2 beat 3", imageUrl: "/images/science-fair-mystery/beat-c2-03.png" },
        { sentenceIndex: 4, illustrationPrompt: "c2 beat 4", imageUrl: "/images/science-fair-mystery/beat-c2-04.png" },
        { sentenceIndex: 5, illustrationPrompt: "c2 beat 5", imageUrl: "/images/science-fair-mystery/beat-c2-05.png" },
      ],
      // c3: 6 beats (indices 0-5)
      c3: [
        { sentenceIndex: 0, illustrationPrompt: "c3 beat 0", imageUrl: "/images/science-fair-mystery/beat-c3-00.png" },
        { sentenceIndex: 1, illustrationPrompt: "c3 beat 1", imageUrl: "/images/science-fair-mystery/beat-c3-01.png" },
        { sentenceIndex: 2, illustrationPrompt: "c3 beat 2", imageUrl: "/images/science-fair-mystery/beat-c3-02.png" },
        { sentenceIndex: 3, illustrationPrompt: "c3 beat 3", imageUrl: "/images/science-fair-mystery/beat-c3-03.png" },
        { sentenceIndex: 4, illustrationPrompt: "c3 beat 4", imageUrl: "/images/science-fair-mystery/beat-c3-04.png" },
        { sentenceIndex: 5, illustrationPrompt: "c3 beat 5", imageUrl: "/images/science-fair-mystery/beat-c3-05.png" },
      ],
    },
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
 * Stage 28c: Added checkpoint support with per-checkpoint image arrays.
 * Returns undefined if no pre-generated image exists (use gradient fallback).
 */
export function getSentenceImageUrl(
  archetypeId: string,
  stage: "intro" | "ending" | "checkpoint",
  sentenceIndex: number,
  checkpointId?: string
): string | undefined {
  const storyData = storyIllustrations[archetypeId];
  if (!storyData) return undefined;

  // Stage 28c: Handle checkpoint-specific lookups
  if (stage === "checkpoint" && checkpointId) {
    const checkpointBeats = storyData.checkpointBeats?.[checkpointId];
    if (!checkpointBeats) return undefined;
    const match = checkpointBeats.find((ill) => ill.sentenceIndex === sentenceIndex);
    return match?.imageUrl ?? undefined;
  }

  const illustrations = stage === "intro" ? storyData.intro : storyData.ending;
  const match = illustrations.find((ill) => ill.sentenceIndex === sentenceIndex);
  return match?.imageUrl ?? undefined;
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
