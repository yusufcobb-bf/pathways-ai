/**
 * Stage 36: Execute NextAction into a RoutingDecision.
 * INTERNAL ONLY — no navigation, no assignment, no side effects.
 */
import { NextAction, RoutingDecision } from "@/data/visual-story";

export function executeNextAction(
  nextAction: NextAction | null
): RoutingDecision {
  // Defensive fallback
  if (!nextAction) {
    return {
      type: "noop",
      source: "system",
      reason: "No nextAction provided",
    };
  }

  switch (nextAction.type) {
    case "assign_training":
      return {
        type: "assign_training",
        virtue: nextAction.virtue,
        source: nextAction.source,
        reason: "Resolved assign_training intent",
      };

    case "repeat_training":
      return {
        type: "repeat_training",
        virtue: nextAction.virtue,
        source: nextAction.source,
        reason: "Resolved repeat_training intent",
      };

    case "await_choice":
      return {
        type: "await_choice",
        source: "system",
        reason: "Awaiting educator or system choice",
      };

    default:
      return {
        type: "noop",
        source: "system",
        reason: "Unhandled NextAction type",
      };
  }
}
