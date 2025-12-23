import { StorySession } from "@/lib/supabase/types";
import {
  getChoiceById,
  getCheckpointForChoice,
  getStoryTitleById,
  getStoryFromPool,
  getStoryPoolPosition,
  CHECKPOINT_LABELS,
} from "@/data/story";
import {
  VIRTUES,
  VIRTUE_DESCRIPTIONS,
  CHOICE_VIRTUE_MAP,
  VirtueScores,
  Virtue,
} from "@/data/virtues";
import { getRecommendedPrompt } from "@/data/discussion-prompts";

interface SessionDetailProps {
  session: StorySession;
}

function ChoiceDetail({ choiceId }: { choiceId: string }) {
  const choice = getChoiceById(choiceId);
  const checkpointInfo = getCheckpointForChoice(choiceId);
  const virtueImpacts = CHOICE_VIRTUE_MAP[choiceId];

  if (!choice || !checkpointInfo) {
    return <div className="text-zinc-400">Unknown choice</div>;
  }

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
        {CHECKPOINT_LABELS[checkpointInfo.index]}
      </div>
      <p className="text-sm text-zinc-700">{choice.text}</p>
      {virtueImpacts && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(virtueImpacts).map(([virtue, score]) => (
            <span
              key={virtue}
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                score > 0
                  ? "bg-green-100 text-green-700"
                  : "bg-zinc-200 text-zinc-600"
              }`}
            >
              {virtue}: {score > 0 ? `+${score}` : score}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function VirtueExplanation({
  virtue,
  score,
}: {
  virtue: Virtue;
  score: number;
}) {
  return (
    <div className="border-b border-zinc-100 py-3 last:border-0">
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-800">{virtue}</span>
        <span
          className={`text-sm font-medium ${
            score > 0
              ? "text-green-600"
              : score < 0
              ? "text-zinc-500"
              : "text-zinc-400"
          }`}
        >
          {score > 0 ? `+${score}` : score}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-500">{VIRTUE_DESCRIPTIONS[virtue]}</p>
    </div>
  );
}

function DiscussionPromptsSection({ scores }: { scores: VirtueScores }) {
  // Get virtues with non-zero scores for focused discussion
  const activeVirtues = VIRTUES.filter((v) => scores[v] !== 0);

  // If no active virtues, show prompts for all
  const virtuesToShow = activeVirtues.length > 0 ? activeVirtues : VIRTUES;

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-blue-900">
        Discussion Prompts
      </h4>
      <p className="mb-4 text-xs text-blue-700">
        Use these questions to guide a reflection conversation with the student.
      </p>
      <div className="space-y-3">
        {virtuesToShow.map((virtue) => {
          const prompt = getRecommendedPrompt(virtue, scores[virtue]);
          return (
            <div key={virtue} className="border-l-2 border-blue-200 pl-3">
              <div className="text-xs font-medium text-blue-600">{virtue}</div>
              <p className="text-sm text-blue-900">{prompt.question}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SessionDetail({ session }: SessionDetailProps) {
  // Get story metadata for this session
  const storyId = session.story_id;
  const poolEntry = getStoryFromPool(storyId);
  const poolPosition = getStoryPoolPosition(storyId);

  return (
    <div className="mt-4 space-y-6 border-t border-zinc-200 pt-4">
      {/* Story Info */}
      <div className="rounded-lg bg-zinc-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-zinc-700">Story Information</h4>
        <div className="space-y-1 text-sm text-zinc-600">
          <p>
            <span className="font-medium text-zinc-700">Title:</span>{" "}
            {getStoryTitleById(storyId)}
          </p>
          <p>
            <span className="font-medium text-zinc-700">ID:</span>{" "}
            <span className="font-mono text-xs">{storyId}</span>
          </p>
          <p>
            <span className="font-medium text-zinc-700">Source:</span>{" "}
            {poolEntry?.isGenerated ? "AI-Generated" : "Fallback Story"}
          </p>
          {poolPosition && (
            <p>
              <span className="font-medium text-zinc-700">Position:</span>{" "}
              Story {poolPosition.position} of {poolPosition.total}
            </p>
          )}
        </div>
      </div>

      {/* Choices Made */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-zinc-700">
          Choices Made
        </h4>
        <div className="space-y-2">
          {session.choices.map((choiceId, index) => (
            <ChoiceDetail key={index} choiceId={choiceId} />
          ))}
        </div>
      </div>

      {/* Virtue Summary */}
      {session.virtue_scores && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-zinc-700">
            Virtue Summary
          </h4>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            {VIRTUES.map((virtue) => (
              <VirtueExplanation
                key={virtue}
                virtue={virtue}
                score={session.virtue_scores![virtue]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Student Reflection */}
      {session.reflection && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-zinc-700">
            Student Reflection
          </h4>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-600 italic">
              &ldquo;{session.reflection}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Discussion Prompts */}
      {session.virtue_scores && (
        <DiscussionPromptsSection scores={session.virtue_scores} />
      )}
    </div>
  );
}
