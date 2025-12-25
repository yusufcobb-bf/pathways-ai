/**
 * Stage 14: Scene Subtitles
 *
 * Maps story archetypes to per-checkpoint subtitles.
 * These update the header as students progress through the story.
 *
 * Index 0 = intro scene
 * Index 1+ = checkpoint scenes
 */

export const storyScenes: Record<string, string[]> = {
  "community-garden-discovery": [
    "A Saturday morning at the community garden",
    "Investigating the damaged seedlings",
    "Gathering clues from fellow volunteers",
    "Deciding how to handle the situation",
  ],
  "after-school-project-partners": [
    "After school in Ms. Chen's classroom",
    "A quiet group discussion begins",
    "Navigating different perspectives",
    "Finding a path forward together",
  ],
  "science-fair-mystery": [
    "Science fair day at school",
    "Discovering what happened",
    "Talking to others involved",
    "Choosing how to respond",
  ],
};

/**
 * Get the scene subtitle for a specific story stage.
 *
 * @param archetypeId - The story archetype ID
 * @param stage - Current stage: "intro" or checkpoint index (0-based)
 * @returns Scene subtitle or undefined if not found
 */
export function getSceneSubtitle(
  archetypeId: string,
  stage: "intro" | number
): string | undefined {
  const scenes = storyScenes[archetypeId];
  if (!scenes) return undefined;

  if (stage === "intro") {
    return scenes[0];
  }

  // Checkpoint index + 1 (since index 0 is intro)
  const sceneIndex = stage + 1;
  return scenes[sceneIndex] ?? scenes[0];
}
