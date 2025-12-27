/**
 * Stage 25: Illustration Prompt Generator
 *
 * Generates standardized prompts for AI image generation.
 * Follows art style guidelines for comic-book/graphic novel aesthetic.
 */

export interface IllustrationPromptConfig {
  artStyle: string;
  ageAppropriate: string;
  constraints: string;
}

const DEFAULT_CONFIG: IllustrationPromptConfig = {
  artStyle:
    "Comic book style illustration, clean lines, soft colors, educational graphic novel aesthetic",
  ageAppropriate:
    "Suitable for grades 4-5, calm and friendly tone, no violence or scary imagery",
  constraints:
    "No text, speech bubbles, or written words in the image. Neutral, inclusive character designs. Calm color palette.",
};

/**
 * Story-specific visual context for richer prompts.
 * Maps archetype IDs to setting descriptions.
 */
const STORY_CONTEXTS: Record<string, string> = {
  "community-garden-discovery":
    "outdoor community garden setting, green plants, garden tools, sunny day",
  "after-school-project-partners":
    "classroom setting, desks and chairs, educational posters, afternoon light",
  "science-fair-mystery":
    "school science fair, display boards, science projects, bright gymnasium",
  "the-new-student":
    "school classroom, students at desks, friendly environment, winter day",
};

/**
 * Generate an illustration prompt for a narrative sentence.
 *
 * @param sentence - The narrative sentence to illustrate
 * @param archetypeId - Story archetype for context
 * @param config - Optional custom configuration
 * @returns Formatted prompt string for AI image generation
 */
export function generateIllustrationPrompt(
  sentence: string,
  archetypeId: string,
  config: Partial<IllustrationPromptConfig> = {}
): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const storyContext = STORY_CONTEXTS[archetypeId] || "school environment";

  // Build the prompt with scene description derived from sentence
  const prompt = [
    finalConfig.artStyle,
    `Scene: ${sentence}`,
    `Setting: ${storyContext}`,
    finalConfig.ageAppropriate,
    finalConfig.constraints,
  ].join(". ");

  return prompt;
}

/**
 * Generate an illustration prompt for a decision scene.
 * Decision scenes get a more dramatic, tension-focused prompt.
 *
 * @param narrative - The decision narrative/prompt
 * @param archetypeId - Story archetype for context
 * @returns Formatted prompt string for AI image generation
 */
export function generateDecisionIllustrationPrompt(
  narrative: string,
  archetypeId: string
): string {
  const storyContext = STORY_CONTEXTS[archetypeId] || "school environment";

  // Extract the emotional core of the decision moment
  const prompt = [
    DEFAULT_CONFIG.artStyle,
    `A moment of decision: ${narrative.split(".")[0]}`,
    `Setting: ${storyContext}`,
    "Character at a crossroads, thoughtful expression",
    DEFAULT_CONFIG.ageAppropriate,
    DEFAULT_CONFIG.constraints,
  ].join(". ");

  return prompt;
}
