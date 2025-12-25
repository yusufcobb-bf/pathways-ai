/**
 * Stage 13: Story Environment Visuals
 *
 * Maps story archetypes to visual presentation data.
 * Uses CSS gradient strings (not Tailwind classes) for dynamic rendering.
 * Can be extended with actual images in the future.
 */

export interface StoryEnvironment {
  gradientStyle: string; // CSS gradient value for inline style
  subtitle?: string;
  imageSrc?: string; // Future: actual environment images
}

// Keys must match the actual story IDs from the JSON files
export const storyEnvironments: Record<string, StoryEnvironment> = {
  "community-garden-discovery": {
    gradientStyle: "linear-gradient(to bottom right, #dcfce7, #a7f3d0)", // green-100 to emerald-200
    subtitle: "A Saturday morning at the community garden",
  },
  "after-school-project-partners": {
    gradientStyle: "linear-gradient(to bottom right, #dbeafe, #e2e8f0)", // blue-100 to slate-200
    subtitle: "After school in Ms. Chen's classroom",
  },
  "science-fair-mystery": {
    gradientStyle: "linear-gradient(to bottom right, #fef3c7, #fed7aa)", // amber-100 to orange-200
    subtitle: "Science fair day at school",
  },
};

export function getStoryEnvironment(
  archetypeId: string
): StoryEnvironment | null {
  return storyEnvironments[archetypeId] ?? null;
}
