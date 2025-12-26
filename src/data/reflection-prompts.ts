/**
 * Stage 16: Guided Reflection Prompts
 *
 * Maps story archetypes to structured, neutral reflection prompts.
 * Prompts are optional, non-evaluative, and suitable for grades 3-8.
 *
 * Design constraints:
 * - NO moral grading or "right/wrong" framing
 * - NO praise, rewards, or behavioral scoring
 * - NO emotional pressure or guilt
 * - Neutral, reflective language only
 */

export interface ReflectionPrompt {
  id: string;
  text: string;
  placeholder: string;
}

export const reflectionPrompts: Record<string, ReflectionPrompt[]> = {
  "community-garden-discovery": [
    {
      id: "cgd-1",
      text: "What did you notice about how the group worked together?",
      placeholder: "I noticed that...",
    },
    {
      id: "cgd-2",
      text: "Was there a moment where you had to decide between different options? What made that decision tricky?",
      placeholder: "The decision was tricky because...",
    },
    {
      id: "cgd-3",
      text: "If you could ask one of the characters a question, what would it be?",
      placeholder: "I would ask...",
    },
  ],
  "after-school-project-partners": [
    {
      id: "aspp-1",
      text: "What did you think about when Elena asked to join the group?",
      placeholder: "I thought about...",
    },
    {
      id: "aspp-2",
      text: "How did the different characters in the story see the situation?",
      placeholder: "I think they saw it differently because...",
    },
    {
      id: "aspp-3",
      text: "What might happen next in this story after the ending?",
      placeholder: "I imagine that...",
    },
  ],
  "science-fair-mystery": [
    {
      id: "sfm-1",
      text: "What were some things you noticed about the situation when you first arrived?",
      placeholder: "I noticed...",
    },
    {
      id: "sfm-2",
      text: "Were there different ways to help in this story? What stood out to you?",
      placeholder: "I noticed there were different ways to...",
    },
    {
      id: "sfm-3",
      text: "What questions do you still have about what happened?",
      placeholder: "I'm still wondering...",
    },
  ],
  // Fallback story
  "the-new-student": [
    {
      id: "tns-1",
      text: "What did you notice about the new student's experience?",
      placeholder: "I noticed...",
    },
    {
      id: "tns-2",
      text: "What made some of the decisions in this story feel harder than others?",
      placeholder: "Some decisions felt harder because...",
    },
    {
      id: "tns-3",
      text: "What would you want to know about the characters after the story ended?",
      placeholder: "I would want to know...",
    },
  ],
};

// Default prompts for unknown archetypes
const defaultPrompts: ReflectionPrompt[] = [
  {
    id: "default-1",
    text: "What moment in the story stood out to you the most?",
    placeholder: "The moment that stood out was...",
  },
  {
    id: "default-2",
    text: "Were there any choices that felt tricky to make?",
    placeholder: "A tricky choice was...",
  },
  {
    id: "default-3",
    text: "What questions do you have after finishing the story?",
    placeholder: "I'm wondering...",
  },
];

/**
 * Get reflection prompts for a specific story archetype.
 * Returns 2-3 prompts tailored to the story, or defaults if not found.
 *
 * @param archetypeId - The story archetype ID
 * @returns Array of reflection prompts (2-3 prompts)
 */
export function getReflectionPrompts(archetypeId: string): ReflectionPrompt[] {
  return reflectionPrompts[archetypeId] ?? defaultPrompts;
}
