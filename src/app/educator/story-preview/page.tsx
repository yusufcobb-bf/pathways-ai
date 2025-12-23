import Link from "next/link";
import { loadStory } from "@/data/story";

/**
 * Educator Story Preview Page
 *
 * Read-only view of the currently active story that students will play.
 * Displays story content in a clean, printable format.
 *
 * - No interactions beyond reading
 * - No virtue scores shown
 * - No editing capabilities
 */

function StoryText({ children }: { children: string }) {
  return (
    <div className="space-y-4 text-zinc-700">
      {children.split("\n\n").map((paragraph, i) => (
        <p key={i} className="leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 border-b border-zinc-200 pb-2 text-lg font-semibold text-zinc-800">
      {children}
    </h2>
  );
}

export default function StoryPreviewPage() {
  const { story, storyId, isGenerated } = loadStory();

  return (
    <div className="mx-auto max-w-3xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">
            Active Story Preview
          </h1>
          <Link
            href="/educator"
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Story source badge */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              isGenerated
                ? "bg-blue-100 text-blue-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {isGenerated ? "AI-Generated Story" : "Fallback Story (Hardcoded)"}
          </span>
          <span className="text-xs text-zinc-400">ID: {storyId}</span>
        </div>
      </div>

      {/* Story Title */}
      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-xl font-bold text-zinc-900">{story.title}</h2>
      </div>

      {/* Intro Section */}
      <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <SectionHeading>Introduction</SectionHeading>
        <StoryText>{story.intro}</StoryText>
      </section>

      {/* Checkpoints */}
      {story.checkpoints.map((checkpoint, index) => (
        <section
          key={checkpoint.id}
          className="mb-8 rounded-lg border border-zinc-200 bg-white p-6"
        >
          <SectionHeading>Checkpoint {index + 1}</SectionHeading>

          {/* Prompt */}
          <div className="mb-6">
            <StoryText>{checkpoint.narrative}</StoryText>
          </div>

          {/* Choices */}
          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="mb-3 text-sm font-medium text-zinc-600">
              Student Choices:
            </p>
            <ul className="space-y-2">
              {checkpoint.choices.map((choice, choiceIndex) => (
                <li key={choice.id} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
                    {String.fromCharCode(65 + choiceIndex)}
                  </span>
                  <span className="text-sm text-zinc-700">{choice.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* Ending Section */}
      <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <SectionHeading>Ending</SectionHeading>
        <StoryText>{story.ending}</StoryText>
      </section>

      {/* Footer note */}
      <p className="text-center text-xs text-zinc-400">
        This is a read-only preview. Students will see this story when they play.
      </p>
    </div>
  );
}
