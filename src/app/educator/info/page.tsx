import Link from "next/link";

/**
 * Educator Info Page (Stage 17)
 *
 * Read-only documentation explaining how Pathways works.
 * No database writes, no logic changes.
 * Protected by educator layout RBAC.
 */

export default function EducatorInfoPage() {
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

      {/* Content Sections */}
      <div className="space-y-6">
        {/* Section 1: Story Structure */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Story Structure
          </h2>
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
        </section>

        {/* Section 2: Story Modes */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Story Modes
          </h2>
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
              {/* Refinement 2: Shuffled Sequence Clarification */}
              <p className="mt-2 text-zinc-500">
                Each student receives a unique order that remains consistent
                across sessions.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Student Flow */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Student Flow
          </h2>
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
        </section>

        {/* Section 4: Educator Preview */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Educator Preview
          </h2>
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
        </section>

        {/* Section 5: Data & Sessions */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Data & Sessions
          </h2>
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
        </section>

        {/* Section 6: Virtues & Decision Tendencies */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Virtues & Decision Tendencies (Reference)
          </h2>
          <div className="space-y-4 text-sm text-zinc-600">
            <p>
              Virtues in Pathways are not grades or evaluations. They are
              informational summaries that reflect patterns in a student&apos;s
              decisions across a story. These tendencies emerge from patterns in
              choices, not from any single decision.
            </p>

            {/* Empathy */}
            <div>
              <h3 className="mb-1 font-medium text-zinc-800">Empathy</h3>
              <p>
                Considering others&apos; feelings and understanding different
                perspectives.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-500">
                <li>Noticing how others might feel</li>
                <li>Understanding different perspectives</li>
                <li>Thinking about group impact</li>
              </ul>
            </div>

            {/* Respect */}
            <div>
              <h3 className="mb-1 font-medium text-zinc-800">Respect</h3>
              <p>
                Treating others with consideration and recognizing boundaries or
                differing perspectives.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-500">
                <li>Listening before acting</li>
                <li>Asking for input</li>
                <li>Avoiding dismissive or dominating choices</li>
              </ul>
            </div>

            {/* Responsibility */}
            <div>
              <h3 className="mb-1 font-medium text-zinc-800">Responsibility</h3>
              <p>
                Taking ownership of actions and following through on
                commitments.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-500">
                <li>Accepting accountability</li>
                <li>Completing shared tasks</li>
                <li>Thinking about consequences</li>
              </ul>
            </div>

            {/* Courage */}
            <div>
              <h3 className="mb-1 font-medium text-zinc-800">Courage</h3>
              <p>
                Willingness to act despite discomfort or uncertainty.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-500">
                <li>Speaking up</li>
                <li>Addressing difficult situations</li>
                <li>Making principled choices even when it&apos;s hard</li>
              </ul>
            </div>

            {/* Self-Control */}
            <div>
              <h3 className="mb-1 font-medium text-zinc-800">Self-Control</h3>
              <p>Managing impulses and thinking before acting.</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-500">
                <li>Pausing before responding</li>
                <li>Choosing calm or measured options</li>
                <li>Avoiding reactive decisions</li>
              </ul>
            </div>

            {/* Disclaimer */}
            <p className="mt-4 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
              Virtue scores reflect tendencies shown within a single story. They
              should be used as discussion starters, not judgments of character
              or behavior.
            </p>
          </div>
        </section>

        {/* Section 7: Roles & Access (was 6) */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Roles & Access
          </h2>
          <div className="space-y-4 text-sm text-zinc-600">
            <div>
              <h3 className="mb-1 font-medium text-zinc-800">Students</h3>
              <ul className="list-disc space-y-1 pl-5">
                <li>Play through assigned stories</li>
                <li>View their own completed sessions</li>
                <li>Cannot access educator features or other students' data</li>
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
        </section>

        {/* Section 7: Common Questions */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Common Questions
          </h2>
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
            {/* Refinement 3: Additional FAQs */}
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
        </section>
      </div>
    </div>
  );
}
