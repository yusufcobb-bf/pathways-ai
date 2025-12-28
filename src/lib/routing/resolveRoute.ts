/**
 * Stage 37: Resolve RoutingDecision into a RouteResult.
 * MVP: Hard-coded routing for Empathy virtue only.
 */
import { RoutingDecision } from "@/data/visual-story";

export type RouteResult =
  | { type: "navigate"; storyId: string }
  | { type: "end" };

export function resolveRoute(
  decision: RoutingDecision | null
): RouteResult {
  if (!decision) {
    return { type: "end" };
  }

  // MVP: Only route Empathy virtue to training story
  if (
    (decision.type === "assign_training" ||
      decision.type === "repeat_training") &&
    decision.virtue === "Empathy"
  ) {
    return {
      type: "navigate",
      storyId: "after-school-project-partners",
    };
  }

  return { type: "end" };
}
