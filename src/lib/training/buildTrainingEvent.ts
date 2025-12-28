/**
 * Stage 32: Build training practice event from choice data.
 * Pure function - no side effects.
 */
import { Virtue } from "@/data/virtues";
import { PracticeIntensity, TrainingPracticeEvent } from "@/data/visual-story";

/**
 * Map XP to practice intensity.
 * - xp >= 5 → "high"
 * - xp >= 3 → "medium"
 * - xp >= 1 → "low"
 */
export function xpToIntensity(xp: number): PracticeIntensity {
  if (xp >= 5) return "high";
  if (xp >= 3) return "medium";
  return "low";
}

/**
 * Build a single training practice event.
 */
export function buildTrainingEvent(
  storyId: string,
  checkpointId: string,
  choiceId: string,
  focusedVirtue: Virtue,
  xp: number
): TrainingPracticeEvent {
  return {
    storyId,
    checkpointId,
    choiceId,
    virtue: focusedVirtue,
    intensity: xpToIntensity(xp),
    xp,
    timestamp: new Date().toISOString(),
  };
}
