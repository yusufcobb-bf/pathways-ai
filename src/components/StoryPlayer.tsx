"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Story,
  Choice,
  isVisualBeatStory,
  extractBeatTexts,
  VisualBeatStory,
} from "@/data/story";
import {
  computeVirtueScores,
  computePositionBasedVirtueScores,
  getVirtueSummary,
  VIRTUES,
  VIRTUE_DESCRIPTIONS,
  VirtueScores,
} from "@/data/virtues";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";
import StorySceneHeader from "./StorySceneHeader";
import { getStoryEnvironment, getStoryGradient } from "@/data/story-environments";
import { getSceneSubtitle } from "@/data/story-scenes";
import { getReflectionPrompts } from "@/data/reflection-prompts";
import StoryStartScreen from "./comic/StoryStartScreen";
import DecisionChoiceGrid from "./comic/DecisionChoiceGrid";
import StoryPager from "./story/StoryPager";
import { parseNarrativeWithLimit } from "@/lib/comic/sentence-parser";

interface StoryPlayerProps {
  story: Story | VisualBeatStory; // Stage 27: Accept either prose or visual beat stories
  storyId: string;
  archetypeId: string; // Stage 8: Story archetype ID
  variantId: string | null; // Stage 8: Variant ID (null = base/canonical story)
  isGenerated: boolean;
  previewMode?: boolean; // Stage 11: Educator preview mode (no DB writes)
  onPreviewExit?: () => void; // Stage 11b: Callback to exit preview and return to setup
  guidedReflectionEnabled?: boolean; // Stage 16: Show guided prompts after completion
  assignmentId?: string | null; // Stage 22: Assignment ID if launched from assignment
}

type Stage = "intro" | "checkpoint" | "ending" | "reflection" | "completed";

interface StoryState {
  stage: Stage;
  checkpointIndex: number;
  choices: string[];
  reflection: string;
  saving: boolean;
  error: string | null;
  virtueScores: VirtueScores | null;
  selectedChoice: { id: string; text: string } | null; // Stage 14: Choice feedback
  isTransitioning: boolean; // Stage 14: Fade transitions
  guidedResponses: Record<string, string>; // Stage 16: Maps prompt.id to response
  checkpointNarrativeComplete: boolean; // Stage 26: Track if checkpoint narrative is read
  globalPageIndex: number; // Stage 26b: Current global page position
  introLastPage: number; // Stage 27: Track last page for back navigation
}

function CheckpointProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="mb-6 flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i < current ? "bg-zinc-700" : "bg-zinc-200"
          }`}
        />
      ))}
    </div>
  );
}

// Stage 26b: Global story progress bar (continuous, not segmented)
function GlobalProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const progress = Math.min((current / total) * 100, 100);
  return (
    <div className="mb-6">
      <div className="h-1.5 w-full rounded-full bg-zinc-200">
        <div
          className="h-1.5 rounded-full bg-zinc-700 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ChoiceList({
  choices,
  onSelect,
  selectedChoiceId,
}: {
  choices: Choice[];
  onSelect: (choiceId: string) => void;
  selectedChoiceId?: string;
}) {
  return (
    <div className="mt-8 space-y-3">
      {choices.map((choice) => {
        const isSelected = choice.id === selectedChoiceId;
        const isDisabled = selectedChoiceId !== undefined;

        return (
          <button
            key={choice.id}
            onClick={() => onSelect(choice.id)}
            disabled={isDisabled}
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              isSelected
                ? "border-zinc-700 bg-zinc-100 text-zinc-900"
                : isDisabled
                ? "border-zinc-100 bg-zinc-50 text-zinc-400"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
            }`}
          >
            {choice.text}
          </button>
        );
      })}
    </div>
  );
}

function StoryText({ children }: { children: string }) {
  return (
    <div className="space-y-4 text-lg leading-relaxed text-zinc-700">
      {children.split("\n\n").map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}

function ContinueButton({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-8 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function VirtueSummary({ scores }: { scores: VirtueScores }) {
  return (
    <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-zinc-900">
        Your Virtue Summary
      </h3>
      <div className="space-y-4">
        {VIRTUES.map((virtue) => {
          const score = scores[virtue];
          return (
            <div key={virtue} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-800">{virtue}</span>
                <span className="text-sm font-medium text-zinc-600">
                  {score > 0 ? `+${score}` : score}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {getVirtueSummary(virtue, score)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {VIRTUE_DESCRIPTIONS[virtue]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StoryPlayer({
  story,
  storyId,
  archetypeId,
  variantId,
  isGenerated,
  previewMode = false,
  onPreviewExit,
  guidedReflectionEnabled = false,
  assignmentId = null,
}: StoryPlayerProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  // Stage 13: Get environment visuals for this story
  const environment = getStoryEnvironment(archetypeId);

  const [state, setState] = useState<StoryState>({
    stage: "intro",
    checkpointIndex: 0,
    choices: [],
    reflection: "",
    saving: false,
    error: null,
    virtueScores: null,
    selectedChoice: null,
    isTransitioning: false,
    guidedResponses: {},
    checkpointNarrativeComplete: false,
    globalPageIndex: 0,
    introLastPage: 0,
  });

  // Stage 25b: Track if user has clicked "Begin Story"
  const [hasStartedStory, setHasStartedStory] = useState(false);

  const totalCheckpoints = story.checkpoints.length;

  // Stage 27: Detect visual beat story format
  const isVisualBeat = isVisualBeatStory(story);

  // Stage 26d/27: Compute all pages once for global page tracking
  // Visual beat stories use extractBeatTexts, prose stories use parseNarrativeWithLimit
  const storySegments = useMemo(() => {
    let introSentences: string[];
    let checkpointSentences: string[][];
    let endingSentences: string[];

    if (isVisualBeatStory(story)) {
      // Stage 27: Visual beat story - extract text directly from beats
      introSentences = extractBeatTexts(story.intro);
      checkpointSentences = story.checkpoints.map((cp) =>
        extractBeatTexts(cp.beats)
      );
      endingSentences = extractBeatTexts(story.ending);
    } else {
      // Legacy prose story - parse narrative into sentences
      introSentences = parseNarrativeWithLimit(story.intro);
      checkpointSentences = story.checkpoints.map((cp) =>
        parseNarrativeWithLimit(cp.narrative)
      );
      endingSentences = parseNarrativeWithLimit(story.ending);
    }

    // Calculate cumulative offsets for each segment
    let offset = 0;
    const introOffset = offset;
    offset += introSentences.length;

    const checkpointOffsets = checkpointSentences.map((sentences) => {
      const cpOffset = offset;
      offset += sentences.length;
      return cpOffset;
    });

    const endingOffset = offset;
    offset += endingSentences.length;

    const totalPages = offset;

    return {
      introSentences,
      introOffset,
      checkpointSentences,
      checkpointOffsets,
      endingSentences,
      endingOffset,
      totalPages,
    };
  }, [story]);

  // Stage 27: Track intro page for back navigation
  const [introCurrentPage, setIntroCurrentPage] = useState(0);

  const handleStartStory = () => {
    // Store the last page of intro when transitioning
    setState((prev) => ({
      ...prev,
      stage: "checkpoint",
      introLastPage: storySegments.introSentences.length - 1,
    }));
  };

  // Stage 27: Handler to go back from checkpoint 0 to intro
  const handleBackToIntro = () => {
    setIntroCurrentPage(storySegments.introSentences.length - 1);
    setState((prev) => ({
      ...prev,
      stage: "intro",
      globalPageIndex: storySegments.introSentences.length - 1,
    }));
  };

  // Stage 26: Handler for when checkpoint narrative is fully read
  const handleCheckpointNarrativeComplete = () => {
    setState((prev) => ({ ...prev, checkpointNarrativeComplete: true }));
  };

  // Stage 26b: Handler for global page updates
  const handleGlobalPageChange = (globalIndex: number) => {
    setState((prev) => ({ ...prev, globalPageIndex: globalIndex }));
  };

  const handleChoice = (choiceId: string) => {
    // Stage 14: Find the selected choice text for feedback
    const currentCheckpoint = story.checkpoints[state.checkpointIndex];
    const selectedChoice = currentCheckpoint.choices.find(c => c.id === choiceId);
    const currentIndex = state.checkpointIndex;

    if (!selectedChoice) return;

    // Show selection feedback
    setState((prev) => ({
      ...prev,
      selectedChoice: { id: choiceId, text: selectedChoice.text },
    }));

    // After brief delay, transition to next scene
    setTimeout(() => {
      setState((prev) => ({ ...prev, isTransitioning: true }));

      // After fade out, advance and fade back in
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        const isLastCheckpoint = nextIndex >= totalCheckpoints;

        setState((prev) => ({
          ...prev,
          choices: [...prev.choices, choiceId],
          stage: isLastCheckpoint ? "ending" : "checkpoint",
          checkpointIndex: isLastCheckpoint ? currentIndex : nextIndex,
          selectedChoice: null,
          isTransitioning: false,
          checkpointNarrativeComplete: false, // Stage 26: Reset for next checkpoint
        }));
      }, 200);
    }, 800);
  };

  const handleContinueToReflection = () => {
    setState((prev) => ({ ...prev, stage: "reflection" }));
  };

  const handleReflectionChange = (value: string) => {
    setState((prev) => ({ ...prev, reflection: value }));
  };

  const handleFinish = async () => {
    // Stage 11: In preview mode, skip all DB operations and virtue computation
    if (previewMode) {
      setState((prev) => ({
        ...prev,
        stage: "completed",
        virtueScores: null, // No virtue scores in preview
      }));
      return;
    }

    if (!user) return;

    setState((prev) => ({ ...prev, saving: true, error: null }));

    // Compute virtue scores from choices
    // Use position-based scoring for generated stories, standard scoring for fallback
    const virtueScores = isGenerated
      ? computePositionBasedVirtueScores(state.choices)
      : computeVirtueScores(state.choices);

    // Stage 16: Build guided_responses only if enabled and at least one response exists
    let guidedResponsesPayload = null;
    if (guidedReflectionEnabled) {
      const prompts = getReflectionPrompts(archetypeId);
      const answeredPrompts = prompts
        .filter((p) => state.guidedResponses[p.id]?.trim())
        .map((p) => ({
          prompt: p.text, // Store full prompt text for session integrity
          response: state.guidedResponses[p.id],
        }));

      if (answeredPrompts.length > 0) {
        guidedResponsesPayload = {
          prompts: answeredPrompts,
          archetypeId,
          completedAt: new Date().toISOString(),
        };
      }
    }

    // Stage 22: Use .select("id").single() to get session ID for assignment tracking
    const { data: sessionData, error } = await supabase
      .from("story_sessions")
      .insert({
        user_id: user.id,
        story_id: storyId,
        variant_id: variantId, // Stage 8: Save which variant was played (null = base story)
        choices: state.choices,
        reflection: state.reflection || null,
        virtue_scores: virtueScores,
        guided_responses: guidedResponsesPayload, // Stage 16: Include in same insert
      })
      .select("id")
      .single();

    if (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: "Failed to save session. Please try again.",
      }));
      return;
    }

    // Stage 24: Update student progress (XP + virtue trends)
    // Calculate XP: +10 base, +5 bonus if assignment
    const baseXp = 10;
    const bonusXp = assignmentId ? 5 : 0;
    const totalXp = baseXp + bonusXp;

    // Increment XP via RPC (atomic, with role guard)
    await supabase.rpc("increment_student_xp", {
      p_student_id: user.id,
      p_xp_delta: totalXp,
    });

    // Update virtue trends via RPC
    if (virtueScores) {
      for (const [virtueId, delta] of Object.entries(virtueScores)) {
        if (delta !== 0) {
          await supabase.rpc("increment_virtue_trend", {
            p_student_id: user.id,
            p_virtue_id: virtueId,
            p_delta: delta,
          });
        }
      }
    }

    // Stage 22: Mark assignment submission as completed if this is an assignment
    if (assignmentId && sessionData?.id) {
      await supabase.from("assignment_submissions").upsert(
        {
          assignment_id: assignmentId,
          student_id: user.id,
          session_id: sessionData.id,
          status: "completed",
          completed_at: new Date().toISOString(),
        },
        { onConflict: "assignment_id,student_id" }
      );
    }

    setState((prev) => ({
      ...prev,
      saving: false,
      stage: "completed",
      virtueScores,
    }));
  };

  const handlePlayAgain = () => {
    // Force a hard navigation to /student to trigger fresh server-side story selection
    // Using window.location ensures the server component fully re-renders
    // with the updated completed session count
    window.location.href = "/student";
  };

  // Stage 16: Guided reflection handler
  const handleGuidedResponseChange = (promptId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      guidedResponses: {
        ...prev.guidedResponses,
        [promptId]: value,
      },
    }));
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Stage 11: Preview Mode Banner */}
      {previewMode && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Educator Preview</strong> — This simulates the student
            experience. No data is saved.
          </p>
        </div>
      )}

      {/* Stage 13: Visual Story Header */}
      {/* Stage 25b: Hide header when showing start screen */}
      {!(state.stage === "intro" && !hasStartedStory) && (
        <StorySceneHeader
          title={story.title}
          subtitle={environment?.subtitle}
          sceneSubtitle={getSceneSubtitle(
            archetypeId,
            state.stage === "intro" ? "intro" : state.checkpointIndex
          )}
          gradientStyle={getStoryGradient(
            archetypeId,
            state.stage === "intro" ? "intro" : state.checkpointIndex
          )}
          imageSrc={environment?.imageSrc}
        />
      )}

      {/* Navigation Link - hidden on start screen */}
      {!(state.stage === "intro" && !hasStartedStory) && (
        <div className="mb-6 flex justify-end gap-4">
          {previewMode ? (
            <>
              {onPreviewExit && (
                <button
                  onClick={onPreviewExit}
                  className="text-sm text-zinc-500 hover:text-zinc-700"
                >
                  Back to Preview Settings
                </button>
              )}
              <Link
                href="/educator"
                className="text-sm text-zinc-500 hover:text-zinc-700"
              >
                Back to Dashboard
              </Link>
            </>
          ) : (
            <Link
              href="/student/sessions"
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              View Past Sessions
            </Link>
          )}
        </div>
      )}

      {/* Stage 25b: Story Start Screen (before intro content) */}
      {state.stage === "intro" && !hasStartedStory && (
        <StoryStartScreen
          title={story.title}
          subtitle={environment?.subtitle}
          gradientStyle={getStoryGradient(archetypeId, "intro")}
          onBegin={() => setHasStartedStory(true)}
        />
      )}

      {/* Stage 26b: Global progress bar (visible during active story, not on decision screens) */}
      {hasStartedStory &&
        !["reflection", "completed"].includes(state.stage) &&
        !(state.stage === "checkpoint" && state.checkpointNarrativeComplete) && (
          <GlobalProgressBar
            current={state.globalPageIndex + 1}
            total={storySegments.totalPages}
          />
        )}

      {/* Stage 26b: Intro pages (after clicking Begin Story) - one sentence per page */}
      {state.stage === "intro" && hasStartedStory && (
        <StoryPager
          sentences={storySegments.introSentences}
          archetypeId={archetypeId}
          stageType="intro"
          globalStartIndex={storySegments.introOffset}
          totalStoryPages={storySegments.totalPages}
          onPageChange={(localIndex) => {
            setIntroCurrentPage(localIndex);
            handleGlobalPageChange(storySegments.introOffset + localIndex);
          }}
          onComplete={handleStartStory}
          initialPage={introCurrentPage}
        />
      )}

      {state.stage === "checkpoint" && (
        <div
          className={`transition-opacity duration-200 ${
            state.isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Stage 26b: Show narrative pages FIRST, then choices */}
          {!state.checkpointNarrativeComplete ? (
            <StoryPager
              sentences={storySegments.checkpointSentences[state.checkpointIndex]}
              archetypeId={archetypeId}
              stageType="checkpoint"
              stageIndex={state.checkpointIndex}
              globalStartIndex={storySegments.checkpointOffsets[state.checkpointIndex]}
              totalStoryPages={storySegments.totalPages}
              onPageChange={(localIndex) =>
                handleGlobalPageChange(
                  storySegments.checkpointOffsets[state.checkpointIndex] + localIndex
                )
              }
              onComplete={handleCheckpointNarrativeComplete}
              // Stage 27: Allow going back to intro from checkpoint 0
              allowPrevAtStart={state.checkpointIndex === 0}
              onPrevAtStart={state.checkpointIndex === 0 ? handleBackToIntro : undefined}
            />
          ) : (
            <>
              {/* Decision choices appear only after narrative is read */}
              <DecisionChoiceGrid
                choices={story.checkpoints[state.checkpointIndex].choices}
                archetypeId={archetypeId}
                checkpointIndex={state.checkpointIndex}
                onSelect={handleChoice}
                selectedChoiceId={state.selectedChoice?.id}
              />
              {/* Stage 14: Neutral choice acknowledgment */}
              {state.selectedChoice && (
                <p className="mt-4 text-sm text-zinc-500">
                  You chose to{" "}
                  {state.selectedChoice.text.toLowerCase().replace(/\.$/, "")}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Stage 26b: Ending pages - one sentence per page */}
      {state.stage === "ending" && (
        <StoryPager
          sentences={storySegments.endingSentences}
          archetypeId={archetypeId}
          stageType="ending"
          globalStartIndex={storySegments.endingOffset}
          totalStoryPages={storySegments.totalPages}
          onPageChange={(localIndex) =>
            handleGlobalPageChange(storySegments.endingOffset + localIndex)
          }
          onComplete={handleContinueToReflection}
        />
      )}

      {state.stage === "reflection" && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">
            Reflection
          </h2>
          {previewMode ? (
            <>
              <p className="mb-6 italic text-zinc-400">
                (Preview mode — reflection step skipped)
              </p>
              <ContinueButton onClick={handleFinish} label="Finish Preview" />
            </>
          ) : (
            <>
              <p className="mb-6 text-zinc-600">
                Take a moment to think about the story and the choices you made.
                What stood out to you? Is there anything you would do
                differently?
              </p>
              <textarea
                value={state.reflection}
                onChange={(e) => handleReflectionChange(e.target.value)}
                placeholder="Write your thoughts here... (required)"
                className={`h-40 w-full rounded-lg border p-4 text-zinc-700 placeholder:text-zinc-400 focus:outline-none ${
                  state.reflection.trim().length === 0
                    ? "border-zinc-200 focus:border-zinc-400"
                    : "border-green-300 focus:border-green-400"
                }`}
              />
              <p className="mt-2 text-sm text-zinc-500">
                {state.reflection.trim().length === 0
                  ? "Please write a reflection to continue."
                  : `${state.reflection.trim().length} characters`}
              </p>

              {/* Stage 16: Optional Guided Prompts Section */}
              {guidedReflectionEnabled && (
                <div className="mt-8 border-t border-zinc-200 pt-6">
                  <h3 className="mb-2 text-lg font-medium text-zinc-800">
                    Optional Reflection Questions
                  </h3>
                  <p className="mb-4 text-sm text-zinc-500">
                    If you&apos;d like to think a bit more deeply, you can
                    answer any of the questions below.
                  </p>
                  <div className="space-y-4">
                    {getReflectionPrompts(archetypeId).map((prompt) => (
                      <div key={prompt.id}>
                        <label className="mb-1 block text-sm font-medium text-zinc-700">
                          {prompt.text}
                        </label>
                        <textarea
                          value={state.guidedResponses[prompt.id] || ""}
                          onChange={(e) =>
                            handleGuidedResponseChange(prompt.id, e.target.value)
                          }
                          placeholder={prompt.placeholder}
                          className="h-20 w-full rounded-lg border border-zinc-200 p-3 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {state.error && (
                <p className="mt-4 text-sm text-red-600">{state.error}</p>
              )}
              <ContinueButton
                onClick={handleFinish}
                label={state.saving ? "Saving..." : "Finish"}
                disabled={state.saving || state.reflection.trim().length === 0}
              />
            </>
          )}
        </div>
      )}

      {state.stage === "completed" && (
        <div>
          <div className="text-center">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900">
              {previewMode ? "Preview Complete" : "Session Complete"}
            </h2>
            <p className="text-zinc-600">
              {previewMode
                ? "This is a preview. No session was saved."
                : "Your story session has been saved."}
            </p>
          </div>

          {/* Stage 11: Hide virtue summary in preview mode */}
          {!previewMode && state.virtueScores && (
            <VirtueSummary scores={state.virtueScores} />
          )}

          <div className="mt-8 flex justify-center gap-4">
            {previewMode ? (
              <>
                {onPreviewExit && (
                  <button
                    onClick={onPreviewExit}
                    className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                  >
                    Preview Again
                  </button>
                )}
                <Link
                  href="/educator"
                  className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
                >
                  Back to Dashboard
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={handlePlayAgain}
                  className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  Play Again
                </button>
                <Link
                  href="/student/sessions"
                  className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
                >
                  View Past Sessions
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
