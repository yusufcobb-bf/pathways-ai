/**
 * Stage 27: Visual Beat Story Format
 *
 * Visual-first story authoring system where stories are authored
 * as a sequence of atomic visual beats from the start.
 * Each beat = ONE actor, ONE action, ONE illustration, ONE sentence.
 */

import { Virtue } from "./virtues";

// CASEL Core Competencies
export type CASELCompetency =
  | "self-awareness"
  | "self-management"
  | "social-awareness"
  | "relationship-skills"
  | "responsible-decision-making";

// Stage 30: Story type for MVP restructure
export type StoryType = "diagnostic" | "training";

// Stage 31: Diagnostic profile types (internal only - not for UI display)
export type VirtueLevel = "low" | "medium" | "high";

export interface DiagnosticProfile {
  storyId: string;
  scores: Record<Virtue, number>;
  levels: Record<Virtue, VirtueLevel>;
  primaryGrowthVirtue: Virtue;
  completedAt: string; // ISO timestamp
}

// Stage 32: Training practice signal types (internal only)
export type PracticeIntensity = "low" | "medium" | "high";

export interface TrainingPracticeEvent {
  storyId: string;
  checkpointId: string;
  choiceId: string;
  virtue: Virtue;
  intensity: PracticeIntensity;
  xp: number;
  timestamp: string;
}

export interface TrainingPracticeProfile {
  storyId: string;
  virtue: Virtue;
  events: TrainingPracticeEvent[];
}

// Stage 33: Training summary (internal only)
export type TrainingOutcome = "weak" | "emerging" | "strong";

export interface TrainingSummary {
  storyId: string;
  virtue: Virtue;
  totalEvents: number;
  intensityCounts: {
    low: number;
    medium: number;
    high: number;
  };
  averageIntensity: PracticeIntensity;
  outcome: TrainingOutcome;
  completedAt: string;
}

// Visual focus type for illustration guidance
export type VisualFocus =
  | "character-action" // A character doing something
  | "character-emotion" // Close-up on emotional expression
  | "dialogue" // Character speaking (speech bubble implied)
  | "observation" // "You notice..." environmental detail
  | "environment" // Wide shot, setting establishment
  | "object" // Focus on a specific item/clue
  | "group" // Multiple characters together (carefully!)
  | "transition"; // Scene change, time passing

// CASEL to Virtue mapping (bidirectional bridge for scoring continuity)
export const CASEL_TO_VIRTUE_MAP: Record<CASELCompetency, Virtue[]> = {
  "self-awareness": ["Courage", "Responsibility"],
  "self-management": ["Self-Control", "Responsibility"],
  "social-awareness": ["Empathy", "Respect"],
  "relationship-skills": ["Empathy", "Respect"],
  "responsible-decision-making": ["Courage", "Responsibility"],
};

// Single visual story beat
export interface VisualBeat {
  id: string; // Unique beat ID (e.g., "intro-1", "c1-3")
  text: string; // The actual sentence shown to reader
  actor?: string; // Primary character (null/undefined for "you" POV)
  focus: VisualFocus; // Illustration guidance
  casel: CASELCompetency[]; // Which competencies this beat supports (1-2 max)
  illustrationHint?: string; // Optional guidance for image generation
}

// Feedback shown after selecting a choice (Stage 29)
export interface ChoiceFeedback {
  xp: number; // XP gained: 1 | 3 | 5
  encouragement: string; // Short positive sentence
}

// Visual choice with scoring data
export interface VisualChoice {
  id: string; // "c1-a", "c1-b", "c1-c"
  text: string; // Choice text
  casel: CASELCompetency[]; // Competencies exercised by this choice
  virtues: Virtue[]; // REQUIRED for scoring continuity
  focus: VisualFocus; // Illustration guidance for choice card
  illustrationHint?: string; // Optional image generation guidance
  feedback?: ChoiceFeedback; // Optional encouragement feedback (Stage 29)
}

// Checkpoint with visual beats and choices
export interface VisualCheckpoint {
  id: string; // "c1", "c2", "c3"
  beats: VisualBeat[]; // Narrative beats before choice
  choices: VisualChoice[]; // 3 visual choice cards
}

// Curriculum alignment (first-class data for educator trust)
export interface CurriculumAlignment {
  subject: string; // e.g., "Social-Emotional Learning"
  unit: string; // e.g., "Building Empathy"
  lesson: string; // e.g., "Understanding Others' Perspectives"
  learningObjectives: string[]; // Teacher-facing objectives
  standardRefs?: string[]; // e.g., ["CASEL.3a", "SEL.4-5.2"]
}

// CASEL coverage documentation
export type CASELCoverage = Record<CASELCompetency, string>;

// Story metadata
export interface VisualBeatStoryMeta {
  authoredAt: string; // ISO timestamp
  authoringVersion: "27.0.0";
  totalBeats: number; // Auto-calculated
  estimatedMinutes: number; // totalBeats * 0.3 (approx)
}

// Complete visual beat story
export interface VisualBeatStory {
  id: string; // Unique story ID
  title: string;
  archetypeId: string; // Links to environment/gradient config
  gradeLevel: "4-5"; // Target audience

  // Stage 30: Story type and focused virtue for MVP modes
  storyType?: StoryType; // "diagnostic" or "training" (undefined = legacy training behavior)
  focusedVirtue?: Virtue; // For training stories: the single virtue to display

  // Curriculum alignment
  curriculum: CurriculumAlignment;

  // SEL objectives in teacher-facing language
  selObjectives: string[];

  // CASEL competency coverage (must include all 5)
  caselCoverage: CASELCoverage;

  // Story structure
  intro: VisualBeat[]; // Opening beats (8-12 recommended)
  checkpoints: VisualCheckpoint[]; // Decision points (exactly 3)
  ending: VisualBeat[]; // Closing beats (4-6 recommended)

  // Metadata
  _meta: VisualBeatStoryMeta;
}

/**
 * Type guard to detect if a story is a VisualBeatStory.
 * Checks if intro is an array of objects with 'focus' property.
 */
export function isVisualBeatStory(
  story: unknown
): story is VisualBeatStory {
  if (!story || typeof story !== "object") return false;
  const s = story as Record<string, unknown>;

  // Check if intro is an array with objects containing 'focus'
  if (!Array.isArray(s.intro)) return false;
  if (s.intro.length === 0) return false;

  const firstBeat = s.intro[0];
  if (!firstBeat || typeof firstBeat !== "object") return false;

  return typeof (firstBeat as Record<string, unknown>).focus === "string";
}

/**
 * Extract page texts from visual beats for StoryPager.
 * Simply maps each beat to its text property.
 */
export function extractBeatTexts(beats: VisualBeat[]): string[] {
  return beats.map((beat) => beat.text);
}

/**
 * Get virtue impacts from a visual choice.
 * Uses the virtues array directly from the choice.
 */
export function getVisualChoiceVirtueImpact(
  choice: VisualChoice
): Partial<Record<Virtue, number>> {
  const impact: Partial<Record<Virtue, number>> = {};

  // Each virtue in the choice gets +2 impact
  for (const virtue of choice.virtues) {
    impact[virtue] = 2;
  }

  return impact;
}
