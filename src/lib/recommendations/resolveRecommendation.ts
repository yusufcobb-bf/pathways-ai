/**
 * Stage 35: Resolve recommendation candidates into a next-action intent.
 * Internal only — no side effects.
 */
import {
  RecommendationCandidate,
  NextAction,
} from "@/data/visual-story";

/**
 * Resolve recommendation candidates into a single next-action intent.
 *
 * Mapping:
 * - diagnostic_gap → assign_training
 * - needs_more_practice → repeat_training
 * - ready_for_next_virtue → assign_training
 * - no candidates → await_choice
 */
// MR-1: Defensive null/undefined handling
export function resolveRecommendation(
  candidates?: RecommendationCandidate[] | null
): NextAction {
  // No recommendation → await user/educator choice
  if (!candidates || candidates.length === 0) {
    return {
      type: "await_choice",
      source: "system",
    };
  }

  const candidate = candidates[0];

  switch (candidate.reason) {
    case "diagnostic_gap":
      return {
        type: "assign_training",
        virtue: candidate.virtue,
        source: "diagnostic",
      };

    case "needs_more_practice":
      return {
        type: "repeat_training",
        virtue: candidate.virtue,
        source: "training",
      };

    case "ready_for_next_virtue":
      return {
        type: "assign_training",
        virtue: candidate.virtue,
        source: "training",
      };

    default:
      return {
        type: "none",
        source: "system",
      };
  }
}
