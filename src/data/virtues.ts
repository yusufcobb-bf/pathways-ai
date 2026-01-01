// SEL Virtue definitions
export const VIRTUES = [
  "Courage",
  "Generosity",
  "Kindness",
  "Knowledge",
  "Resilience",
] as const;

export type Virtue = (typeof VIRTUES)[number];

export type VirtueScores = Record<Virtue, number>;

// TEMPORARY — Stage 1 compatibility only
// Static scoring map for each choice
// Positive choices: +1 or +2
// Neutral: 0
// Slightly negative: -1
export const CHOICE_VIRTUE_MAP: Record<string, Partial<VirtueScores>> = {
  // Checkpoint 1: First interaction opportunity
  "c1-a": {
    // "Walk over and introduce yourself to the new student"
    Kindness: 2,
    Courage: 2,
  },
  "c1-b": {
    // "Stay with your friends but smile at the new student"
    Kindness: 1,
    Resilience: 1,
  },
  "c1-c": {
    // "Focus on catching up with your friends for now"
    Kindness: -1,
  },

  // Checkpoint 2: Group project partner decision
  "c2-a": {
    // "Ask if the new student wants to join your group"
    Kindness: 2,
    Courage: 1,
    Knowledge: 1,
  },
  "c2-b": {
    // "Partner with your friend and hope someone else includes them"
    Kindness: -1,
    Knowledge: -1,
  },

  // Checkpoint 3: Lunch table decision
  "c3-a": {
    // "Invite the new student to come sit with your group"
    Kindness: 2,
    Courage: 2,
  },
  "c3-b": {
    // "Sit at your usual table but save a seat in case they want to join"
    Kindness: 1,
    Generosity: 1,
  },
  "c3-c": {
    // "Eat with your friends — they'll probably find their own group soon"
    Kindness: -1,
  },
};

// Static explanatory text for each virtue
export const VIRTUE_DESCRIPTIONS: Record<Virtue, string> = {
  Courage: "Standing up for what is right, even when it feels hard.",
  Generosity: "Sharing your time, resources, or kindness with others.",
  Kindness: "Treating others with care and compassion.",
  Knowledge: "Seeking to learn and understand the world around you.",
  Resilience: "Bouncing back from challenges and keeping going.",
};

// Compute virtue scores from an array of choice IDs
export function computeVirtueScores(choices: string[]): VirtueScores {
  const scores: VirtueScores = {
    Courage: 0,
    Generosity: 0,
    Kindness: 0,
    Knowledge: 0,
    Resilience: 0,
  };

  for (const choiceId of choices) {
    const impacts = CHOICE_VIRTUE_MAP[choiceId];
    if (impacts) {
      for (const [virtue, value] of Object.entries(impacts)) {
        scores[virtue as Virtue] += value;
      }
    }
  }

  return scores;
}

// Get a summary message based on virtue score
export function getVirtueSummary(virtue: Virtue, score: number): string {
  if (score >= 3) {
    return `You showed strong ${virtue.toLowerCase()} in your choices.`;
  } else if (score >= 1) {
    return `You demonstrated ${virtue.toLowerCase()} at key moments.`;
  } else if (score === 0) {
    return `${virtue} wasn't a major factor in your decisions.`;
  } else {
    return `There were opportunities to show more ${virtue.toLowerCase()}.`;
  }
}

// TEMPORARY — Stage 1 compatibility only
// Position-based virtue mapping for AI-generated stories
// Since AI doesn't generate scores, we use the choice position to determine virtue impacts
// The system prompt ensures: a = most engaged, b = moderate, c = least engaged
const POSITION_VIRTUE_MAP: Record<string, Partial<VirtueScores>> = {
  a: { Kindness: 2, Courage: 2 },
  b: { Kindness: 1, Resilience: 1 },
  c: { Kindness: -1 },
};

// Get virtue impact for a choice based on its position (a, b, or c)
export function getPositionBasedVirtueImpact(
  choiceId: string
): Partial<VirtueScores> {
  // Extract the letter from choice ID (e.g., "c1-a" → "a")
  const match = choiceId.match(/^c[1-3]-([abc])$/);
  if (!match) return {};

  const position = match[1];
  return POSITION_VIRTUE_MAP[position] || {};
}

// Compute virtue scores using position-based mapping (for generated stories)
export function computePositionBasedVirtueScores(
  choices: string[]
): VirtueScores {
  const scores: VirtueScores = {
    Courage: 0,
    Generosity: 0,
    Kindness: 0,
    Knowledge: 0,
    Resilience: 0,
  };

  for (const choiceId of choices) {
    const impacts = getPositionBasedVirtueImpact(choiceId);
    for (const [virtue, value] of Object.entries(impacts)) {
      scores[virtue as Virtue] += value;
    }
  }

  return scores;
}
