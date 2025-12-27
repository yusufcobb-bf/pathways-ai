/**
 * Lesson Metadata Layer (Stage 19)
 *
 * Canonical source of truth defining each story as a structured lesson
 * for curriculum documentation and school/district approval.
 *
 * RULES:
 * - Educator-facing ONLY
 * - Read-only, informational only
 * - Must match existing story archetypes
 * - Virtue IDs must match virtue-framework.ts exactly
 */

export interface LessonMetadata {
  archetypeId: string;
  lessonTitle: string;
  learningObjectives: string[];
  essentialQuestion: string;
  targetVirtues: string[]; // Virtue IDs (must match virtue-framework.ts)
  caselDomains: string[]; // CASEL-aligned domains
  estimatedTimeMinutes: number; // Typical range: 30–40
}

/**
 * LESSON_METADATA
 *
 * Only includes entries for story archetypes that exist in the codebase.
 * Virtue IDs must match virtue-framework.ts exactly.
 */
export const LESSON_METADATA: Record<string, LessonMetadata> = {
  "missing-art-supplies": {
    archetypeId: "missing-art-supplies",
    lessonTitle: "Seeking Context Before Judgment",
    learningObjectives: [
      "Practice gathering information before making assumptions",
      "Demonstrate empathy by considering others' circumstances",
      "Identify constructive responses to peer conflicts",
    ],
    essentialQuestion:
      "How can we understand situations better before reacting?",
    targetVirtues: ["empathy", "respect", "responsibility"],
    caselDomains: ["Social Awareness", "Responsible Decision-Making"],
    estimatedTimeMinutes: 30,
  },
  "community-garden-discovery": {
    archetypeId: "community-garden-discovery",
    lessonTitle: "Discovering Solutions Together",
    learningObjectives: [
      "Observe situations before drawing conclusions",
      "Consider how actions affect shared spaces",
      "Practice collaborative problem-solving",
    ],
    essentialQuestion:
      "How can we solve problems while considering everyone involved?",
    targetVirtues: ["empathy", "responsibility"],
    caselDomains: ["Social Awareness", "Responsible Decision-Making"],
    estimatedTimeMinutes: 35,
  },
  "after-school-project-partners": {
    archetypeId: "after-school-project-partners",
    lessonTitle: "Working Through Group Decisions",
    learningObjectives: [
      "Identify how group decisions affect others",
      "Consider multiple perspectives before choosing an action",
      "Reflect on the impact of collaboration",
    ],
    essentialQuestion: "How do our choices affect the people we work with?",
    targetVirtues: ["empathy", "respect"],
    caselDomains: ["Social Awareness", "Relationship Skills"],
    estimatedTimeMinutes: 35,
  },
  "science-fair-mystery": {
    archetypeId: "science-fair-mystery",
    lessonTitle: "Responding to Unexpected Challenges",
    learningObjectives: [
      "Manage reactions when things go wrong",
      "Consider different explanations before acting",
      "Take responsibility for next steps",
    ],
    essentialQuestion: "How do we respond when something unexpected happens?",
    targetVirtues: ["self_control", "responsibility"],
    caselDomains: ["Self-Management", "Responsible Decision-Making"],
    estimatedTimeMinutes: 35,
  },
  "the-new-student": {
    archetypeId: "the-new-student",
    lessonTitle: "Welcoming New Perspectives",
    learningObjectives: [
      "Recognize when someone may feel excluded",
      "Consider how small actions can make others feel welcome",
      "Practice inclusive decision-making",
    ],
    essentialQuestion: "How can we make others feel included?",
    targetVirtues: ["empathy", "courage"],
    caselDomains: ["Social Awareness", "Relationship Skills"],
    estimatedTimeMinutes: 30,
  },
};

/**
 * Get lesson metadata for a specific archetype
 */
export function getLessonMetadata(
  archetypeId: string
): LessonMetadata | null {
  return LESSON_METADATA[archetypeId] ?? null;
}

/**
 * Get all lesson metadata entries
 */
export function getAllLessonMetadata(): LessonMetadata[] {
  return Object.values(LESSON_METADATA);
}
