/**
 * Stage 31: Diagnostic Signal Mapping
 *
 * Converts diagnostic story choices into an internal virtue profile.
 * INTERNAL ONLY - not for UI display, no persistence, no recommendations.
 */

import { Virtue, VIRTUES } from "@/data/virtues";
import { VirtueLevel, DiagnosticProfile } from "@/data/visual-story";

// Rubric: storyId -> choiceId -> virtue -> points (0-2)
// Keys must EXACTLY match story.id values (R3)
const DIAGNOSTIC_RUBRICS: Record<
  string,
  Record<string, Partial<Record<Virtue, number>>>
> = {
  "missing-art-supplies": {
    // Checkpoint 1
    "c1-a": { Kindness: 2, Generosity: 1 }, // Walk over to Leo - strong kindness
    "c1-b": { Courage: 2, Knowledge: 1 }, // Suggest looking around - cautious approach
    "c1-c": { Knowledge: 1 }, // Let Maya handle it - minimal engagement

    // Checkpoint 2
    "c2-a": { Kindness: 2, Generosity: 1 }, // Ask Leo if he'd like help - supportive
    "c2-b": { Courage: 2, Knowledge: 2 }, // Explain & offer to talk to teacher
    "c2-c": { Courage: 1 }, // Tell Leo to put paints back - direct

    // Checkpoint 3
    "c3-a": { Kindness: 2, Generosity: 2 }, // Make something together - collaborative
    "c3-b": { Courage: 1, Knowledge: 2 }, // Help return paints quietly
    "c3-c": { Generosity: 2, Knowledge: 1 }, // Let Leo decide - generous autonomy
  },

  "arraadia-mono-intro": {
    // Checkpoint 1: Reaction to Injustice
    "c1-a": { Courage: 2 }, // Confront soldiers directly
    "c1-b": { Resilience: 1, Knowledge: 1 }, // Stay quiet and observe
    "c1-c": { Kindness: 2, Knowledge: 1 }, // Negotiate calmly

    // Checkpoint 2: Preparation Strategy
    "c2-a": { Knowledge: 2 }, // Lower-quality crops
    "c2-b": { Courage: 2, Resilience: 1 }, // Create defensive tools
    "c2-c": { Knowledge: 1, Resilience: 2 }, // Build protective walls

    // Checkpoint 3: Treatment of Others
    "c3-a": { Kindness: 2, Generosity: 1 }, // Comfort young villager
    "c3-b": { Kindness: 1, Knowledge: 2 }, // Explain to elder respectfully
    "c3-c": { Resilience: 2 }, // Focus on task

    // Checkpoint 4: Facing Fear Under Pressure
    "c4-a": { Courage: 2, Kindness: 1 }, // Stand tall against general
    "c4-b": { Knowledge: 2, Resilience: 1 }, // Propose negotiation
    "c4-c": { Kindness: 2, Generosity: 2 }, // Rally villagers together

    // Checkpoint 5: Identity / Values Choice
    "c5-a": { Courage: 2 }, // Challenge to combat
    "c5-b": { Knowledge: 2, Generosity: 1 }, // Use village strengths
    "c5-c": { Kindness: 1, Resilience: 2 }, // Offer harvest to prevent bloodshed
  },
};

/**
 * Compute max possible points per virtue for a given story.
 * For each checkpoint, takes the max contribution from any choice.
 */
function computeMaxScores(storyId: string): Record<Virtue, number> {
  const rubric = DIAGNOSTIC_RUBRICS[storyId];
  const maxScores: Record<Virtue, number> = {
    Courage: 0,
    Generosity: 0,
    Kindness: 0,
    Knowledge: 0,
    Resilience: 0,
  };

  if (!rubric) return maxScores;

  // Dynamically detect checkpoints from rubric keys (e.g., "c1-a" -> "c1")
  const checkpointSet = new Set<string>();
  for (const choiceId of Object.keys(rubric)) {
    const match = choiceId.match(/^(c\d+)/);
    if (match) checkpointSet.add(match[1]);
  }
  const checkpoints = Array.from(checkpointSet).sort();

  // For each checkpoint, take the max contribution from any choice
  for (const cp of checkpoints) {
    const cpChoices = Object.entries(rubric).filter(([id]) =>
      id.startsWith(cp + "-")
    );
    for (const virtue of VIRTUES) {
      const maxForCp = Math.max(
        ...cpChoices.map(([, scores]) => scores[virtue] ?? 0)
      );
      maxScores[virtue] += maxForCp;
    }
  }

  return maxScores;
}

/**
 * Convert scores to levels using relative thresholds.
 * - high: >= 70% of max
 * - medium: >= 40% and < 70%
 * - low: < 40% or max === 0
 */
export function toVirtueLevels(
  scores: Record<Virtue, number>,
  maxScores: Record<Virtue, number>
): Record<Virtue, VirtueLevel> {
  const levels: Record<Virtue, VirtueLevel> = {} as Record<Virtue, VirtueLevel>;

  for (const virtue of VIRTUES) {
    const score = scores[virtue];
    const max = maxScores[virtue];

    if (max === 0 || score === 0) {
      levels[virtue] = "low";
    } else {
      const ratio = score / max;
      if (ratio >= 0.7) levels[virtue] = "high";
      else if (ratio >= 0.4) levels[virtue] = "medium";
      else levels[virtue] = "low";
    }
  }

  return levels;
}

/**
 * Find the virtue with lowest ratio (needs most growth).
 * Skips virtues with max === 0 (not measurable in this story).
 */
export function getPrimaryGrowthVirtue(
  scores: Record<Virtue, number>,
  maxScores: Record<Virtue, number>
): Virtue {
  let minRatio = Infinity;
  let growthVirtue: Virtue = "Kindness";

  for (const virtue of VIRTUES) {
    const max = maxScores[virtue];
    if (max === 0) continue; // Skip virtues not measurable in this story

    const ratio = scores[virtue] / max;
    if (ratio < minRatio) {
      minRatio = ratio;
      growthVirtue = virtue;
    }
  }

  return growthVirtue;
}

/**
 * Dev-time validation: warn if any virtue is missing from rubric.
 * Resilience gap is intentional for MVP (R2).
 */
function validateRubricCoverage(storyId: string): void {
  if (process.env.NODE_ENV !== "development") return;

  const maxScores = computeMaxScores(storyId);
  const missingVirtues = VIRTUES.filter((v) => maxScores[v] === 0);

  if (missingVirtues.length > 0) {
    console.warn(
      `[Stage 31] Diagnostic rubric "${storyId}" does not cover: ${missingVirtues.join(", ")}`
    );
  }
}

/**
 * Build diagnostic profile from story choices.
 * Pure function - no side effects except dev-time console.warn.
 *
 * @param storyId - Must match DIAGNOSTIC_RUBRICS key exactly (R3)
 * @param chosenChoiceIds - Array of choice IDs made by student
 * @returns DiagnosticProfile with scores, levels, and growth virtue
 */
export function buildDiagnosticProfile(
  storyId: string,
  chosenChoiceIds: string[]
): DiagnosticProfile {
  const rubric = DIAGNOSTIC_RUBRICS[storyId];

  // Initialize scores
  const scores: Record<Virtue, number> = {
    Courage: 0,
    Generosity: 0,
    Kindness: 0,
    Knowledge: 0,
    Resilience: 0,
  };

  // If unknown story, return safe default
  if (!rubric) {
    return {
      storyId,
      scores,
      levels: {
        Courage: "low",
        Generosity: "low",
        Kindness: "low",
        Knowledge: "low",
        Resilience: "low",
      },
      primaryGrowthVirtue: "Kindness",
      completedAt: new Date().toISOString(),
    };
  }

  // Dev validation (R2 - warning only, no modifications)
  validateRubricCoverage(storyId);

  // Sum scores from chosen choices
  for (const choiceId of chosenChoiceIds) {
    const choiceScores = rubric[choiceId];
    if (choiceScores) {
      for (const [virtue, points] of Object.entries(choiceScores)) {
        scores[virtue as Virtue] += points;
      }
    }
  }

  const maxScores = computeMaxScores(storyId);
  const levels = toVirtueLevels(scores, maxScores);
  const primaryGrowthVirtue = getPrimaryGrowthVirtue(scores, maxScores);

  return {
    storyId,
    scores,
    levels,
    primaryGrowthVirtue,
    completedAt: new Date().toISOString(),
  };
}
