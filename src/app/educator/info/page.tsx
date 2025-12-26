import Link from "next/link";
import { getVirtueDefinitions, getVirtueById } from "@/data/virtue-framework";
import { getAllLessonMetadata, getLessonMetadata } from "@/data/lesson-metadata";
import { getCurriculumScope } from "@/data/curriculum-scope";

/**
 * Educator Info Page (Stage 17 + Stage 18)
 *
 * Read-only documentation explaining how Pathways works.
 * No database writes, no logic changes.
 * Protected by educator layout RBAC.
 *
 * Stage 18: Uses canonical VIRTUE_FRAMEWORK for virtue definitions.
 */

export default function EducatorInfoPage() {
  const virtues = getVirtueDefinitions();
  const lessons = getAllLessonMetadata();
  const curriculum = getCurriculumScope();
  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">
            How Pathways Works
          </h1>
          <p className="text-zinc-600">
            A guide to stories, settings, and student experiences.
          </p>
          {/* Refinement 1: Intro Disclaimer */}
          <p className="mt-2 text-sm text-zinc-500">
            This guide explains how Pathways works today. It is informational
            only and does not affect student behavior, settings, or saved data.
          </p>
        </div>
        <Link
          href="/educator"
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Content Sections - Stage 19.1: Collapsible */}
      <div className="space-y-4">
        {/* Section 1: Story Structure (default open) */}
        <details
          open
          className="group rounded-lg border border-zinc-200 bg-white"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-zinc-900 hover:bg-zinc-50">
            <span>Story Structure</span>
            <span className="text-zinc-400 transition-transform group-open:rotate-90">
              ▶
            </span>
          </summary>
          <div className="px-6 pb-6 pt-2">
            <div className="space-y-4 text-sm text-zinc-600">
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">
                  What is a Story Archetype?
                </h3>
                <p>
                  An archetype is a core story template with a fixed structure of
                  decision points (checkpoints). Each archetype defines the
                  narrative flow and the choices students can make at each moment.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">
                  What is a Variant?
                </h3>
                <p>
                  Variants are alternate versions of the same archetype. They
                  share identical choice structures but feature different
                  narrative details such as character names, locations, or
                  settings. This provides variety while maintaining consistent
                  decision-making scenarios.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">
                  What Students See
                </h3>
                <p>
                  Students experience stories naturally without seeing technical
                  terms like &ldquo;archetype&rdquo; or &ldquo;variant.&rdquo;
                  They simply play through the story as presented.
                </p>
              </div>
            </div>
          </div>
        </details>

        {/* Section 2: Story Modes */}
        <details className="group rounded-lg border border-zinc-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-zinc-900 hover:bg-zinc-50">
            <span>Story Modes</span>
            <span className="text-zinc-400 transition-transform group-open:rotate-90">
              ▶
            </span>
          </summary>
          <div className="px-6 pb-6 pt-2">
            <div className="space-y-4 text-sm text-zinc-600">
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">Fixed Sequence</h3>
                <p>
                  Students progress through stories in the exact order you
                  configure. After completing one story, they move to the next in
                  the list.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">Single Story</h3>
                <p>
                  All students play only the selected story. Useful for focused
                  classroom discussions where everyone experiences the same
                  scenario.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">
                  Shuffled Sequence
                </h3>
                <p>
                  Each student receives a unique randomized order of all enabled
                  stories. The order is generated once per student and persisted,
                  so they always continue from where they left off.
                </p>
                <p className="mt-2 text-zinc-500">
                  Each student receives a unique order that remains consistent
                  across sessions.
                </p>
              </div>
            </div>
          </div>
        </details>

        {/* Section 3: Student Flow */}
        <details className="group rounded-lg border border-zinc-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-zinc-900 hover:bg-zinc-50">
            <span>Student Flow</span>
            <span className="text-zinc-400 transition-transform group-open:rotate-90">
              ▶
            </span>
          </summary>
          <div className="px-6 pb-6 pt-2">
            <div className="space-y-4 text-sm text-zinc-600">
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">Story Stages</h3>
                <p>
                  Each story follows this progression: Introduction, Checkpoints
                  (decision points), Ending, and Reflection.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    <strong>Introduction:</strong> Sets up the scenario and
                    characters
                  </li>
                  <li>
                    <strong>Checkpoints:</strong> Students make choices at key
                    decision moments
                  </li>
                  <li>
                    <strong>Ending:</strong> The story concludes based on choices
                    made
                  </li>
                  <li>
                    <strong>Reflection:</strong> Students write about their
                    experience
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">
                  Reflection Requirements
                </h3>
                <p>
                  The free-form reflection is required before a session can be
                  saved. If guided reflection prompts are enabled, they appear as
                  optional questions below the main reflection textarea.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">When Data Saves</h3>
                <p>
                  A session is only saved to the database after the student
                  completes their reflection and clicks Finish. Partial sessions
                  are not stored.
                </p>
              </div>
            </div>
          </div>
        </details>

        {/* Section 4: Educator Preview */}
        <details className="group rounded-lg border border-zinc-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-zinc-900 hover:bg-zinc-50">
            <span>Educator Preview</span>
            <span className="text-zinc-400 transition-transform group-open:rotate-90">
              ▶
            </span>
          </summary>
          <div className="px-6 pb-6 pt-2">
            <div className="space-y-4 text-sm text-zinc-600">
              <p>
                Preview mode lets you experience stories exactly as students would
                see them, with important differences:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Read-only:</strong> No data is saved to the database
                </li>
                <li>
                  <strong>Manual selection:</strong> You can choose any
                  story/variant combination
                </li>
                <li>
                  <strong>Simulates new student:</strong> Always shows the
                  experience as if it were a first session
                </li>
                <li>
                  <strong>Reflection skipped:</strong> The reflection step is
                  abbreviated in preview
                </li>
              </ul>
              <p className="text-zinc-500">
                Use preview to familiarize yourself with content before assigning
                stories to students.
              </p>
            </div>
          </div>
        </details>

        {/* Section 5: Data & Sessions */}
        <details className="group rounded-lg border border-zinc-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-zinc-900 hover:bg-zinc-50">
            <span>Data & Sessions</span>
            <span className="text-zinc-400 transition-transform group-open:rotate-90">
              ▶
            </span>
          </summary>
          <div className="px-6 pb-6 pt-2">
            <div className="space-y-4 text-sm text-zinc-600">
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">What Gets Stored</h3>
                <p>Each completed session records:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>The choices made at each checkpoint</li>
                  <li>The free-form reflection text</li>
                  <li>
                    Guided reflection responses (if enabled and answered)
                  </li>
                  <li>Virtue scores calculated from choices</li>
                  <li>Which story and variant were played</li>
                  <li>Timestamp of completion</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">
                  About Virtue Scores
                </h3>
                <p>
                  Virtue scores are informational summaries that reflect the
                  tendencies shown in a student&apos;s choices. They are not
                  grades and should be used as discussion starters, not
                  evaluations.
                </p>
              </div>
            </div>
          </div>
        </details>

        {/* Section 6: Virtue Framework & Learning Alignment (Stage 18) */}
        <details className="group rounded-lg border border-zinc-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-zinc-900 hover:bg-zinc-50">
            <span>Virtue Framework & Learning Alignment</span>
            <span className="text-zinc-400 transition-transform group-open:rotate-90">
              ▶
            </span>
          </summary>
          <div className="px-6 pb-6 pt-2">
            <div className="space-y-4 text-sm text-zinc-600">
              <p>
                Virtues in Pathways are not grades or evaluations. They are
                informational summaries that reflect patterns in a student&apos;s
                decisions across a story. These tendencies emerge from patterns in
                choices, not from any single decision.
              </p>

              {/* Virtue cards from canonical framework */}
              {virtues.map((virtue) => (
                <div
                  key={virtue.id}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 p-4"
                >
                  <h3 className="mb-1 font-medium text-zinc-800">{virtue.name}</h3>
                  <p className="text-zinc-600">{virtue.description}</p>

                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Examples of Decision Tendencies
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-zinc-500">
                      {virtue.decisionTendencies.map((tendency, i) => (
                        <li key={i}>{tendency}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Learning Alignment
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      CASEL: {virtue.caselDomains.join(", ")}
                    </p>
                  </div>
                </div>
              ))}

              {/* Disclaimer */}
              <p className="mt-4 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
                Virtue scores reflect tendencies shown within a single story. They
                should be used as discussion starters, not judgments of character
                or behavior. These definitions are provided for educational
                reference and curriculum alignment purposes.
              </p>
            </div>
          </div>
        </details>

        {/* Section 7: Lessons & Learning Objectives (Stage 19) */}
        <details className="group rounded-lg border border-zinc-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-zinc-900 hover:bg-zinc-50">
            <span>Lessons & Learning Objectives (Curriculum Reference)</span>
            <span className="text-zinc-400 transition-transform group-open:rotate-90">
              ▶
            </span>
          </summary>
          <div className="px-6 pb-6 pt-2">
            <p className="mb-6 text-sm text-zinc-600">
              Each Pathways story functions as a structured lesson with clear
              learning goals. This information is provided for curriculum planning
              and instructional alignment.
            </p>

            <div className="space-y-4">
              {lessons.map((lesson) => (
                <div
                  key={lesson.archetypeId}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 p-4"
                >
                  <h3 className="font-medium text-zinc-800">
                    {lesson.lessonTitle}
                  </h3>
                  <p className="mt-1 text-sm italic text-zinc-600">
                    &ldquo;{lesson.essentialQuestion}&rdquo;
                  </p>

                  {/* Learning Objectives */}
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Learning Objectives
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-zinc-600">
                      {lesson.learningObjectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Target Virtues */}
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Target Virtues
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {lesson.targetVirtues
                        .map((id) => getVirtueById(id)?.name)
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>

                  {/* CASEL Alignment */}
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      CASEL Alignment
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {lesson.caselDomains.join(", ")}
                    </p>
                  </div>

                  {/* Estimated Time */}
                  <p className="mt-3 text-xs text-zinc-400">
                    Estimated time: {lesson.estimatedTimeMinutes} minutes
                  </p>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* Section 8: Curriculum Scope & Sequence (Stage 20) */}
        <details className="group rounded-lg border border-zinc-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-zinc-900 hover:bg-zinc-50">
            <span>Curriculum Scope & Sequence (Grades 4–5)</span>
            <span className="text-zinc-400 transition-transform group-open:rotate-90">
              ▶
            </span>
          </summary>
          <div className="px-6 pb-6 pt-2">
            {/* Intro text with refinements */}
            <div className="mb-6 text-sm text-zinc-600">
              <p>
                Pathways is a 12-lesson social-emotional learning curriculum
                designed for Grades 4–5. Lessons are organized into virtue-based
                units, with each unit focusing on a specific character trait.
              </p>
              <p className="mt-2">
                Some lessons (story archetypes) appear in multiple units and are
                revisited with different instructional focus aligned to the
                target virtue of each unit.
              </p>
              <p className="mt-2 text-zinc-500">
                Educators may adjust pacing or sequence based on classroom
                needs. Designed for approximately one lesson per week.
              </p>
            </div>

            {/* Unit cards */}
            <div className="space-y-4">
              {curriculum.units.map((unit) => (
                <div
                  key={unit.unitId}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 p-4"
                >
                  <h3 className="font-medium text-zinc-800">{unit.unitTitle}</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Target Virtue: {getVirtueById(unit.targetVirtue)?.name} •{" "}
                    {unit.gradeBand}
                  </p>

                  {/* Ordered lesson list */}
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-zinc-600">
                    {unit.lessons.map((lessonRef) => {
                      const lessonMeta = getLessonMetadata(lessonRef.archetypeId);
                      return (
                        <li key={`${unit.unitId}-${lessonRef.archetypeId}`}>
                          {lessonMeta?.lessonTitle ?? lessonRef.archetypeId}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>

            {/* Summary footer */}
            <p className="mt-4 border-t border-zinc-100 pt-4 text-xs text-zinc-400">
              {curriculum.units.length} units • {curriculum.totalLessons} total
              lessons
            </p>
          </div>
        </details>

        {/* Section 9: Roles & Access */}
        <details className="group rounded-lg border border-zinc-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-zinc-900 hover:bg-zinc-50">
            <span>Roles & Access</span>
            <span className="text-zinc-400 transition-transform group-open:rotate-90">
              ▶
            </span>
          </summary>
          <div className="px-6 pb-6 pt-2">
            <div className="space-y-4 text-sm text-zinc-600">
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">Students</h3>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Play through assigned stories</li>
                  <li>View their own completed sessions</li>
                  <li>Cannot access educator features or other students&apos; data</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">Educators</h3>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Configure story settings and selection modes</li>
                  <li>View all student sessions and reflections</li>
                  <li>Preview any story/variant combination</li>
                  <li>Access discussion prompts for each session</li>
                </ul>
              </div>
            </div>
          </div>
        </details>

        {/* Section 10: Common Questions */}
        <details className="group rounded-lg border border-zinc-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-zinc-900 hover:bg-zinc-50">
            <span>Common Questions</span>
            <span className="text-zinc-400 transition-transform group-open:rotate-90">
              ▶
            </span>
          </summary>
          <div className="px-6 pb-6 pt-2">
            <div className="space-y-4 text-sm text-zinc-600">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="mb-1 font-medium text-zinc-800">
                  Why don&apos;t students see all stories at once?
                </h3>
                <p>
                  Students progress through stories based on the selection mode
                  you configure. This allows for structured progression and
                  focused classroom discussions.
                </p>
              </div>
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="mb-1 font-medium text-zinc-800">
                  Why doesn&apos;t preview save data?
                </h3>
                <p>
                  Preview mode is designed for educators to experience content
                  without affecting student data or session counts.
                </p>
              </div>
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="mb-1 font-medium text-zinc-800">
                  Why are guided prompts optional?
                </h3>
                <p>
                  Guided reflection prompts provide additional reflection
                  opportunities without requiring more from students who have
                  already written a thoughtful free-form response.
                </p>
              </div>
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="mb-1 font-medium text-zinc-800">
                  Why can&apos;t students skip the reflection step?
                </h3>
                <p>
                  Reflection ensures students pause to think about their decisions
                  before a session is saved.
                </p>
              </div>
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="mb-1 font-medium text-zinc-800">
                  Can students replay the same story?
                </h3>
                <p>
                  Students may replay stories depending on the selected story
                  mode.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-zinc-800">
                  Why does preview always start from the first story?
                </h3>
                <p>
                  Preview mode simulates a brand-new student and does not use
                  saved progress.
                </p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
