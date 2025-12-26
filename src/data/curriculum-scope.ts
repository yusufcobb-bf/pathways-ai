/**
 * Curriculum Scope & Sequence (Stage 20)
 *
 * Canonical source of truth for curriculum scope, units, and lesson sequencing.
 * This file defines how individual lessons (from lesson-metadata.ts)
 * are organized into units for curriculum planning.
 *
 * RULES:
 * - Educator-facing ONLY
 * - Read-only, informational only
 * - archetypeId must match lesson-metadata.ts exactly
 * - targetVirtue must match virtue-framework.ts exactly
 */

export interface CurriculumLessonRef {
  archetypeId: string; // Must match lesson-metadata.ts
  lessonOrder: number; // Order within the unit
}

export interface CurriculumUnit {
  unitId: string;
  unitTitle: string;
  targetVirtue: string; // Virtue ID from virtue-framework.ts
  gradeBand: string; // "Grades 4–5"
  lessons: CurriculumLessonRef[];
}

export interface CurriculumScope {
  gradeBand: string;
  totalLessons: number;
  units: CurriculumUnit[];
}

/**
 * CURRICULUM_SCOPE
 *
 * Defines 5 virtue-based units with 12 total lessons for Grades 4–5.
 * Some story archetypes appear in multiple units and are revisited
 * with different instructional focus aligned to each unit's target virtue.
 */
export const CURRICULUM_SCOPE: CurriculumScope = {
  gradeBand: "Grades 4–5",
  totalLessons: 12,
  units: [
    {
      unitId: "empathy",
      unitTitle: "Empathy & Understanding Others",
      targetVirtue: "empathy",
      gradeBand: "Grades 4–5",
      lessons: [
        { archetypeId: "the-new-student", lessonOrder: 1 },
        { archetypeId: "after-school-project-partners", lessonOrder: 2 },
        { archetypeId: "community-garden-discovery", lessonOrder: 3 },
      ],
    },
    {
      unitId: "responsibility",
      unitTitle: "Responsibility & Accountability",
      targetVirtue: "responsibility",
      gradeBand: "Grades 4–5",
      lessons: [
        { archetypeId: "science-fair-mystery", lessonOrder: 1 },
        { archetypeId: "community-garden-discovery", lessonOrder: 2 },
        { archetypeId: "after-school-project-partners", lessonOrder: 3 },
      ],
    },
    {
      unitId: "respect",
      unitTitle: "Respect & Working With Others",
      targetVirtue: "respect",
      gradeBand: "Grades 4–5",
      lessons: [
        { archetypeId: "after-school-project-partners", lessonOrder: 1 },
        { archetypeId: "the-new-student", lessonOrder: 2 },
      ],
    },
    {
      unitId: "courage",
      unitTitle: "Courage & Speaking Up",
      targetVirtue: "courage",
      gradeBand: "Grades 4–5",
      lessons: [
        { archetypeId: "the-new-student", lessonOrder: 1 },
        { archetypeId: "science-fair-mystery", lessonOrder: 2 },
      ],
    },
    {
      unitId: "self-control",
      unitTitle: "Self-Control & Managing Reactions",
      targetVirtue: "self_control",
      gradeBand: "Grades 4–5",
      lessons: [
        { archetypeId: "science-fair-mystery", lessonOrder: 1 },
        { archetypeId: "after-school-project-partners", lessonOrder: 2 },
      ],
    },
  ],
};

/**
 * Get the full curriculum scope
 */
export function getCurriculumScope(): CurriculumScope {
  return CURRICULUM_SCOPE;
}

/**
 * Get all curriculum units
 */
export function getCurriculumUnits(): CurriculumUnit[] {
  return CURRICULUM_SCOPE.units;
}
