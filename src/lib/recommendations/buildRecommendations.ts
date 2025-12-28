/**
 * Stage 34: Build recommendation candidates from diagnostic and training signals.
 * Internal only — no side effects.
 */
import { Virtue, VIRTUES } from "@/data/virtues";
import {
  DiagnosticProfile,
  TrainingSummary,
  RecommendationCandidate,
} from "@/data/visual-story";

// R2: Diagnostic ordering clarification
// NOTE:
// Diagnostic ordering assumes lower raw score = greater growth need.
// Scores are story-relative and NOT normalized across diagnostics.
// Future stages may introduce normalization or multi-diagnostic aggregation.

/**
 * Find virtues with "low" level from diagnostic profile, ordered by score (lowest first).
 */
function getLowestVirtues(diagnostic: DiagnosticProfile): Virtue[] {
  return VIRTUES
    .filter((v) => diagnostic.levels[v] === "low")
    .sort((a, b) => diagnostic.scores[a] - diagnostic.scores[b]);
}

/**
 * Build recommendation candidates based on available signals.
 *
 * Rules:
 * 1. If DiagnosticProfile exists: recommend lowest-performing virtue
 * 2. If TrainingSummary exists:
 *    - weak/emerging → repeat same virtue
 *    - strong → advance to next lowest diagnostic virtue
 * 3. If only one signal exists: use that signal
 * 4. If neither exists: return []
 */
export function buildRecommendations(
  diagnostic: DiagnosticProfile | null,
  training: TrainingSummary | null
): RecommendationCandidate[] {
  const candidates: RecommendationCandidate[] = [];

  // Case 1: Neither signal exists
  if (!diagnostic && !training) {
    return [];
  }

  // Case 2: Only diagnostic exists
  if (diagnostic && !training) {
    const lowestVirtues = getLowestVirtues(diagnostic);
    if (lowestVirtues.length > 0) {
      candidates.push({
        virtue: lowestVirtues[0],
        reason: "diagnostic_gap",
        confidence: "medium",
      });
    }
    return candidates;
  }

  // Case 3: Only training exists
  if (!diagnostic && training) {
    if (training.outcome === "weak" || training.outcome === "emerging") {
      candidates.push({
        virtue: training.virtue,
        reason: "needs_more_practice",
        confidence: "medium",
      });
    }
    // If strong with no diagnostic, no recommendation (nothing to compare against)
    return candidates;
  }

  // Case 4: Both exist
  if (diagnostic && training) {
    if (training.outcome === "weak" || training.outcome === "emerging") {
      // Needs more practice on the same virtue
      candidates.push({
        virtue: training.virtue,
        reason: "needs_more_practice",
        confidence: "high",
      });
    } else {
      // Strong outcome → ready for next virtue
      const lowestVirtues = getLowestVirtues(diagnostic);
      // Find next virtue that isn't the one just trained
      const nextVirtue = lowestVirtues.find((v) => v !== training.virtue);
      if (nextVirtue) {
        candidates.push({
          virtue: nextVirtue,
          reason: "ready_for_next_virtue",
          confidence: "high",
        });
      }
    }
  }

  // R1: Enforce single recommendation cap for MVP determinism
  return candidates.slice(0, 1);
}
