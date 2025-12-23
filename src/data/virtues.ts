// SEL Virtue definitions
export const VIRTUES = [
  "Empathy",
  "Respect",
  "Responsibility",
  "Courage",
  "Self-Control",
] as const;

export type Virtue = (typeof VIRTUES)[number];

export type VirtueScores = Record<Virtue, number>;

// Static scoring map for each choice
// Positive choices: +1 or +2
// Neutral: 0
// Slightly negative: -1
export const CHOICE_VIRTUE_MAP: Record<string, Partial<VirtueScores>> = {
  // Checkpoint 1: First interaction opportunity
  "c1-a": {
    // "Walk over and introduce yourself to the new student"
    Empathy: 2,
    Courage: 2,
  },
  "c1-b": {
    // "Stay with your friends but smile at the new student"
    Empathy: 1,
    "Self-Control": 1,
  },
  "c1-c": {
    // "Focus on catching up with your friends for now"
    Empathy: -1,
  },

  // Checkpoint 2: Group project partner decision
  "c2-a": {
    // "Ask if the new student wants to join your group"
    Empathy: 2,
    Courage: 1,
    Responsibility: 1,
  },
  "c2-b": {
    // "Partner with your friend and hope someone else includes them"
    Empathy: -1,
    Responsibility: -1,
  },

  // Checkpoint 3: Lunch table decision
  "c3-a": {
    // "Invite the new student to come sit with your group"
    Empathy: 2,
    Courage: 2,
  },
  "c3-b": {
    // "Sit at your usual table but save a seat in case they want to join"
    Empathy: 1,
    Respect: 1,
  },
  "c3-c": {
    // "Eat with your friends — they'll probably find their own group soon"
    Empathy: -1,
  },
};

// Static explanatory text for each virtue
export const VIRTUE_DESCRIPTIONS: Record<Virtue, string> = {
  Empathy: "Understanding and sharing the feelings of others.",
  Respect: "Treating others with consideration and dignity.",
  Responsibility: "Being accountable for your actions and their impact.",
  Courage: "Doing what is right even when it feels uncomfortable.",
  "Self-Control": "Managing your impulses and thinking before acting.",
};

// Compute virtue scores from an array of choice IDs
export function computeVirtueScores(choices: string[]): VirtueScores {
  const scores: VirtueScores = {
    Empathy: 0,
    Respect: 0,
    Responsibility: 0,
    Courage: 0,
    "Self-Control": 0,
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

// Position-based virtue mapping for AI-generated stories
// Since AI doesn't generate scores, we use the choice position to determine virtue impacts
// The system prompt ensures: a = most empathetic, b = moderate, c = least engaged
const POSITION_VIRTUE_MAP: Record<string, Partial<VirtueScores>> = {
  a: { Empathy: 2, Courage: 2 },
  b: { Empathy: 1, "Self-Control": 1 },
  c: { Empathy: -1 },
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
    Empathy: 0,
    Respect: 0,
    Responsibility: 0,
    Courage: 0,
    "Self-Control": 0,
  };

  for (const choiceId of choices) {
    const impacts = getPositionBasedVirtueImpact(choiceId);
    for (const [virtue, value] of Object.entries(impacts)) {
      scores[virtue as Virtue] += value;
    }
  }

  return scores;
}
