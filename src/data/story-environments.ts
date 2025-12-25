/**
 * Stage 13: Story Environment Visuals
 * Stage 15: Added moodGradients for per-checkpoint mood progression
 *
 * Maps story archetypes to visual presentation data.
 * Uses CSS gradient strings (not Tailwind classes) for dynamic rendering.
 * Can be extended with actual images in the future.
 */

export interface StoryEnvironment {
  gradientStyle: string; // CSS gradient value for inline style (fallback)
  moodGradients?: string[]; // Stage 15: Per-checkpoint gradients [intro, cp0, cp1, cp2]
  subtitle?: string;
  imageSrc?: string; // Future: actual environment images
}

// Keys must match the actual story IDs from the JSON files
// Stage 15: moodGradients indexing: [0]=intro, [1]=cp0, [2]=cp1, [3]=cp2
export const storyEnvironments: Record<string, StoryEnvironment> = {
  "community-garden-discovery": {
    gradientStyle: "linear-gradient(to bottom right, #dcfce7, #a7f3d0)", // green-100 to emerald-200
    moodGradients: [
      "linear-gradient(to bottom right, #dcfce7, #a7f3d0)", // intro: calm green
      "linear-gradient(to bottom right, #dbeafe, #bae6fd)", // cp0: curious blue
      "linear-gradient(to bottom right, #e0e7ff, #c7d2fe)", // cp1: thoughtful indigo
      "linear-gradient(to bottom right, #fef3c7, #fde68a)", // cp2: resolved amber
    ],
    subtitle: "A Saturday morning at the community garden",
  },
  "after-school-project-partners": {
    gradientStyle: "linear-gradient(to bottom right, #dbeafe, #e2e8f0)", // blue-100 to slate-200
    moodGradients: [
      "linear-gradient(to bottom right, #dbeafe, #e2e8f0)", // intro: calm slate-blue
      "linear-gradient(to bottom right, #e0e7ff, #ddd6fe)", // cp0: interactive lavender
      "linear-gradient(to bottom right, #fce7f3, #fbcfe8)", // cp1: balanced pink
      "linear-gradient(to bottom right, #ccfbf1, #99f6e4)", // cp2: harmonious teal
    ],
    subtitle: "After school in Ms. Chen's classroom",
  },
  "science-fair-mystery": {
    gradientStyle: "linear-gradient(to bottom right, #fef3c7, #fed7aa)", // amber-100 to orange-200
    moodGradients: [
      "linear-gradient(to bottom right, #fef3c7, #fed7aa)", // intro: energetic amber
      "linear-gradient(to bottom right, #ede9fe, #ddd6fe)", // cp0: curious purple
      "linear-gradient(to bottom right, #fce7f3, #fbcfe8)", // cp1: collaborative pink
      "linear-gradient(to bottom right, #dcfce7, #bbf7d0)", // cp2: resolved green
    ],
    subtitle: "Science fair day at school",
  },
};

export function getStoryEnvironment(
  archetypeId: string
): StoryEnvironment | null {
  return storyEnvironments[archetypeId] ?? null;
}

/**
 * Stage 15: Get the mood gradient for a specific story stage.
 *
 * Indexing: [0]=intro, [1]=cp0, [2]=cp1, [3]=cp2
 *
 * @param archetypeId - The story archetype ID
 * @param stage - Current stage: "intro" or checkpoint index (0-based)
 * @returns CSS gradient string or undefined if not found
 */
export function getStoryGradient(
  archetypeId: string,
  stage: "intro" | number
): string | undefined {
  const env = storyEnvironments[archetypeId];
  if (!env) return undefined;

  // If no moodGradients, fallback to base gradientStyle
  if (!env.moodGradients) return env.gradientStyle;

  if (stage === "intro") {
    return env.moodGradients[0] ?? env.gradientStyle;
  }

  // Checkpoint index + 1 (since index 0 is intro)
  const gradientIndex = stage + 1;
  return env.moodGradients[gradientIndex] ?? env.moodGradients[0] ?? env.gradientStyle;
}
