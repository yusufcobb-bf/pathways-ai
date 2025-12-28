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
    "c1-a": { Empathy: 2, Respect: 1 }, // Walk over to Leo - strong empathy
    "c1-b": { Courage: 2, Responsibility: 1 }, // Suggest looking around - cautious approach
    "c1-c": { Responsibility: 1 }, // Let Maya handle it - minimal engagement

    // Checkpoint 2
    "c2-a": { Empathy: 2, Respect: 1 }, // Ask Leo if he'd like help - supportive
    "c2-b": { Courage: 2, Responsibility: 2 }, // Explain & offer to talk to teacher
    "c2-c": { Courage: 1 }, // Tell Leo to put paints back - direct

    // Checkpoint 3
    "c3-a": { Empathy: 2, Respect: 2 }, // Make something together - collaborative
    "c3-b": { Courage: 1, Responsibility: 2 }, // Help return paints quietly
    "c3-c": { Respect: 2, Responsibility: 1 }, // Let Leo decide - respectful autonomy
  },
};

/**
 * Compute max possible points per virtue for a given story.
 * For each checkpoint, takes the max contribution from any choice.
 */
function computeMaxScores(storyId: string): Record<Virtue, number> {
  const rubric = DIAGNOSTIC_RUBRICS[storyId];
  const maxScores: Record<Virtue, number> = {
    Empathy: 0,
    Respect: 0,
    Responsibility: 0,
    Courage: 0,
    "Self-Control": 0,
  };

  if (!rubric) return maxScores;

  // For each checkpoint, take the max contribution from any choice
  const checkpoints = ["c1", "c2", "c3"];
  for (const cp of checkpoints) {
    const cpChoices = Object.entries(rubric).filter(([id]) =>
      id.startsWith(cp)
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
  let growthVirtue: Virtue = "Empathy";

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
 * Self-Control gap is intentional for MVP (R2).
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
    Empathy: 0,
    Respect: 0,
    Responsibility: 0,
    Courage: 0,
    "Self-Control": 0,
  };

  // If unknown story, return safe default
  if (!rubric) {
    return {
      storyId,
      scores,
      levels: {
        Empathy: "low",
        Respect: "low",
        Responsibility: "low",
        Courage: "low",
        "Self-Control": "low",
      },
      primaryGrowthVirtue: "Empathy",
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
