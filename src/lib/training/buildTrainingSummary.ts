/**
 * Stage 33: Build summary from TrainingPracticeProfile.
 * Internal only — no side effects.
 */
import {
  TrainingPracticeProfile,
  TrainingSummary,
  PracticeIntensity,
} from "@/data/visual-story";

function intensityToScore(intensity: PracticeIntensity): number {
  if (intensity === "high") return 3;
  if (intensity === "medium") return 2;
  return 1;
}

function scoreToIntensity(avg: number): PracticeIntensity {
  if (avg >= 2.5) return "high";
  if (avg >= 1.7) return "medium";
  return "low";
}

function scoreToOutcome(avg: number): "strong" | "emerging" | "weak" {
  if (avg >= 2.5) return "strong";
  if (avg >= 1.7) return "emerging";
  return "weak";
}

export function buildTrainingSummary(
  profile: TrainingPracticeProfile
): TrainingSummary {
  // R1: Explicit zero-event handling for clarity
  if (profile.events.length === 0) {
    return {
      storyId: profile.storyId,
      virtue: profile.virtue,
      totalEvents: 0,
      intensityCounts: { low: 0, medium: 0, high: 0 },
      averageIntensity: "low",
      outcome: "weak",
      completedAt: new Date().toISOString(),
    };
  }

  const counts = { low: 0, medium: 0, high: 0 };
  let totalScore = 0;

  for (const event of profile.events) {
    counts[event.intensity]++;
    totalScore += intensityToScore(event.intensity);
  }

  const totalEvents = profile.events.length;
  const avgScore = totalScore / totalEvents;

  return {
    storyId: profile.storyId,
    virtue: profile.virtue,
    totalEvents,
    intensityCounts: counts,
    averageIntensity: scoreToIntensity(avgScore),
    outcome: scoreToOutcome(avgScore),
    completedAt: new Date().toISOString(),
  };
}
