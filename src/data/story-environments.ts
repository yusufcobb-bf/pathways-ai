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
// Stage 42: Added missing stories for MC-2 (visual parity)
export const storyEnvironments: Record<string, StoryEnvironment> = {
  // Diagnostic story - MC-2: Must look equally polished
  "missing-art-supplies": {
    gradientStyle: "linear-gradient(to bottom right, #fef3c7, #fcd34d)", // amber-100 to amber-300
    moodGradients: [
      "linear-gradient(to bottom right, #fef3c7, #fcd34d)", // intro: warm amber
      "linear-gradient(to bottom right, #e0e7ff, #c7d2fe)", // cp0: thoughtful indigo
      "linear-gradient(to bottom right, #fce7f3, #fbcfe8)", // cp1: attentive pink
      "linear-gradient(to bottom right, #dcfce7, #a7f3d0)", // cp2: resolved green
    ],
    subtitle: "A mystery in art class",
  },
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
  "science-lab-mystery": {
    gradientStyle: "linear-gradient(to bottom right, #ede9fe, #ddd6fe)", // violet-100 to violet-200
    moodGradients: [
      "linear-gradient(to bottom right, #ede9fe, #ddd6fe)", // intro: curious violet
      "linear-gradient(to bottom right, #dbeafe, #bae6fd)", // cp0: analytical blue
      "linear-gradient(to bottom right, #fef3c7, #fed7aa)", // cp1: discovery amber
      "linear-gradient(to bottom right, #dcfce7, #bbf7d0)", // cp2: resolved green
    ],
    subtitle: "A science experiment gone wrong",
  },
  "park-cleanup-puzzle": {
    gradientStyle: "linear-gradient(to bottom right, #ccfbf1, #99f6e4)", // teal-100 to teal-200
    moodGradients: [
      "linear-gradient(to bottom right, #ccfbf1, #99f6e4)", // intro: fresh teal
      "linear-gradient(to bottom right, #dcfce7, #a7f3d0)", // cp0: nature green
      "linear-gradient(to bottom right, #fef3c7, #fde68a)", // cp1: energetic amber
      "linear-gradient(to bottom right, #dbeafe, #bae6fd)", // cp2: calm blue
    ],
    subtitle: "An afternoon at the neighborhood park",
  },
  "the-missing-project": {
    gradientStyle: "linear-gradient(to bottom right, #fce7f3, #fbcfe8)", // pink-100 to pink-200
    moodGradients: [
      "linear-gradient(to bottom right, #fce7f3, #fbcfe8)", // intro: gentle pink
      "linear-gradient(to bottom right, #e0e7ff, #c7d2fe)", // cp0: uncertain indigo
      "linear-gradient(to bottom right, #fef3c7, #fed7aa)", // cp1: hopeful amber
      "linear-gradient(to bottom right, #dcfce7, #a7f3d0)", // cp2: resolved green
    ],
    subtitle: "A project presentation day dilemma",
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
