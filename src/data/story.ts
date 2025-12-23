import {
  GeneratedStory,
  safeValidateGeneratedStory,
} from "@/lib/ai/story-schema";

export interface Choice {
  id: string;
  text: string;
}

export interface Checkpoint {
  id: string;
  narrative: string;
  choices: Choice[];
}

export interface Story {
  title: string;
  intro: string;
  checkpoints: Checkpoint[];
  ending: string;
}

// Normalize a GeneratedStory (with "prompt") to Story (with "narrative")
function normalizeGeneratedStory(generated: GeneratedStory): Story {
  return {
    title: generated.title,
    intro: generated.intro,
    checkpoints: generated.checkpoints.map((cp) => ({
      id: cp.id,
      narrative: cp.prompt, // Map "prompt" to "narrative"
      choices: cp.choices,
    })),
    ending: generated.ending,
  };
}

// Try to import the generated story (may not exist)
let generatedStoryData: unknown = null;
try {
  // This import will fail at build time if the file doesn't exist
  // which is expected behavior - we'll use the fallback story
  generatedStoryData = require("./generated-story.json");
} catch {
  // File doesn't exist - this is expected if story hasn't been generated yet
}

// Load story from generated JSON file, falling back to hardcoded story
export function loadStory(): { story: Story; storyId: string; isGenerated: boolean } {
  if (generatedStoryData) {
    const validation = safeValidateGeneratedStory(generatedStoryData);

    if (validation.success && validation.data) {
      return {
        story: normalizeGeneratedStory(validation.data),
        storyId: validation.data.id,
        isGenerated: true,
      };
    }

    console.warn("Generated story validation failed:", validation.error?.message);
  }

  return {
    story: fallbackStory,
    storyId: "the-new-student",
    isGenerated: false,
  };
}

// Fallback story used when no generated story is available
export const fallbackStory: Story = {
  title: "The New Student",
  intro: `It's the first day back at school after winter break. You walk into your classroom and notice someone sitting alone at the back — a new student you've never seen before.

They look nervous, glancing around the room while everyone else catches up with their friends.

Your best friend waves you over to sit with them, but you can't stop thinking about the new kid sitting by themselves.`,

  checkpoints: [
    {
      id: "checkpoint-1",
      narrative: `The bell hasn't rung yet, and you have a few minutes before class starts.

The new student is doodling in their notebook, not talking to anyone. Your friend is excitedly telling a group about their holiday trip.

What do you do?`,
      choices: [
        {
          id: "c1-a",
          text: "Walk over and introduce yourself to the new student",
        },
        {
          id: "c1-b",
          text: "Stay with your friends but smile at the new student",
        },
        {
          id: "c1-c",
          text: "Focus on catching up with your friends for now",
        },
      ],
    },
    {
      id: "checkpoint-2",
      narrative: `Later that morning, the teacher assigns a group project. Everyone quickly pairs up with their friends.

You notice the new student is left without a partner, looking around awkwardly. Your friend nudges you — they want to be your partner like always.

What do you do?`,
      choices: [
        {
          id: "c2-a",
          text: "Ask if the new student wants to join your group",
        },
        {
          id: "c2-b",
          text: "Partner with your friend and hope someone else includes them",
        },
      ],
    },
    {
      id: "checkpoint-3",
      narrative: `At lunch, you see the new student sitting alone at a table in the corner of the cafeteria.

Your usual table is full of your friends laughing and having fun. The new student is eating quietly, looking at their phone.

What do you do?`,
      choices: [
        {
          id: "c3-a",
          text: "Invite the new student to come sit with your group",
        },
        {
          id: "c3-b",
          text: "Sit at your usual table but save a seat in case they want to join",
        },
        {
          id: "c3-c",
          text: "Eat with your friends — they'll probably find their own group soon",
        },
      ],
    },
  ],

  ending: `The school day comes to an end. As everyone packs up to leave, the new student catches your eye and gives you a small wave.

Whatever choices you made today, you had the chance to think about how your actions might affect someone else.

Starting at a new school isn't easy. Sometimes a small gesture — a smile, an invitation, or just noticing someone — can make a big difference.`,
};

// Backwards-compatible export (used by SessionDetail)
export const story = fallbackStory;

// Helper function to get a choice by its ID from a given story
export function getChoiceByIdFromStory(
  storyData: Story,
  choiceId: string
): Choice | undefined {
  for (const checkpoint of storyData.checkpoints) {
    const choice = checkpoint.choices.find((c) => c.id === choiceId);
    if (choice) return choice;
  }
  return undefined;
}

// Helper function to get checkpoint info for a choice ID from a given story
export function getCheckpointForChoiceFromStory(
  storyData: Story,
  choiceId: string
): { checkpoint: Checkpoint; index: number } | undefined {
  for (let i = 0; i < storyData.checkpoints.length; i++) {
    const checkpoint = storyData.checkpoints[i];
    if (checkpoint.choices.some((c) => c.id === choiceId)) {
      return { checkpoint, index: i };
    }
  }
  return undefined;
}

// Helper function to get a choice by its ID (uses fallback story for backwards compatibility)
export function getChoiceById(choiceId: string): Choice | undefined {
  return getChoiceByIdFromStory(fallbackStory, choiceId);
}

// Helper function to get checkpoint info for a choice ID (uses fallback story for backwards compatibility)
export function getCheckpointForChoice(choiceId: string): {
  checkpoint: Checkpoint;
  index: number;
} | undefined {
  return getCheckpointForChoiceFromStory(fallbackStory, choiceId);
}

// Checkpoint labels for display
export const CHECKPOINT_LABELS = [
  "First Interaction",
  "Group Project",
  "Lunch Table",
] as const;

// Get story title by ID (for displaying in session history)
export function getStoryTitleById(storyId: string): string {
  // Check if it's the fallback story
  if (storyId === "the-new-student") {
    return fallbackStory.title;
  }

  // Check if we have a generated story with this ID
  if (generatedStoryData) {
    const validation = safeValidateGeneratedStory(generatedStoryData);
    if (validation.success && validation.data && validation.data.id === storyId) {
      return validation.data.title;
    }
  }

  // Default fallback for unknown story IDs
  return storyId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
