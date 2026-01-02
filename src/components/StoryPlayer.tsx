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
  VisualChoice,
  DiagnosticProfile,
  TrainingPracticeProfile,
  TrainingSummary,
  RecommendationCandidate,
  NextAction,
  RoutingDecision,
} from "@/data/story";
import { VisualBeat, TacticalLoop, VisualCheckpoint } from "@/data/visual-story";
import BranchBeatPlayer from "./story/BranchBeatPlayer";
import TacticalLoopUI from "./story/TacticalLoopUI";
import { buildDiagnosticProfile } from "@/lib/diagnostics/diagnosticScoring";
import { buildTrainingEvent } from "@/lib/training/buildTrainingEvent";
import { buildTrainingSummary } from "@/lib/training/buildTrainingSummary";
import { buildRecommendations } from "@/lib/recommendations/buildRecommendations";
import { resolveRecommendation } from "@/lib/recommendations/resolveRecommendation";
import { executeNextAction } from "@/lib/routing/executeNextAction";
import { resolveRoute, RouteResult } from "@/lib/routing/resolveRoute";
import { Virtue } from "@/data/virtues";
import { FeedbackOverlay } from "./story/FeedbackOverlay";
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

// Stage 4B: Added "tactical" for tactical loop after c5
type Stage = "intro" | "checkpoint" | "ending" | "reflection" | "completed" | "tactical";

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
  activeFeedback: { // Stage 29: Live encouragement feedback
    xp: number;
    virtues: Virtue[];
    encouragement: string;
  } | null;
  diagnosticProfile: DiagnosticProfile | null; // Stage 31: Internal only
  trainingProfile: TrainingPracticeProfile | null; // Stage 32: Internal only
  trainingSummary: TrainingSummary | null; // Stage 33: Internal only
  recommendations: RecommendationCandidate[] | null; // Stage 34: Internal only
  nextAction: NextAction | null; // Stage 35: Internal intent only
  routingDecision: RoutingDecision | null; // Stage 36: Execution result (internal only)
  routeResult: RouteResult | null; // Stage 37: Final route execution

  // Stage 4B: Branch playback state
  branchBeatsToPlay: VisualBeat[] | null;
  isAutoCheckpoint: boolean; // True when processing c3 (no player choice)

  // Stage 4B: Tactical loop state (non-scoring)
  tacticalStage: "inactive" | "intro" | "selecting" | "playing" | "conclusion";
  usedTactics: Set<string>;
  currentTacticalBeats: VisualBeat[] | null;
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

  // Stage 32: Compute initial training profile for training stories
  const visualStoryRef = isVisualBeatStory(story) ? story : null;
  const initialTrainingProfile: TrainingPracticeProfile | null =
    visualStoryRef?.storyType === "training" && visualStoryRef.focusedVirtue
      ? {
          storyId: storyId,
          virtue: visualStoryRef.focusedVirtue,
          events: [],
        }
      : null;

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
    activeFeedback: null,
    diagnosticProfile: null, // Stage 31
    trainingProfile: initialTrainingProfile, // Stage 32
    trainingSummary: null, // Stage 33
    recommendations: null, // Stage 34
    nextAction: null, // Stage 35
    routingDecision: null, // Stage 36
    routeResult: null, // Stage 37
    // Stage 4B: Branch playback
    branchBeatsToPlay: null,
    isAutoCheckpoint: false,
    // Stage 4B: Tactical loop
    tacticalStage: "inactive",
    usedTactics: new Set<string>(),
    currentTacticalBeats: null,
  });

  // Stage 25b: Track if user has clicked "Begin Story"
  const [hasStartedStory, setHasStartedStory] = useState(false);

  // Stage 37: routeResult is computed but NOT auto-executed.
  // Routing execution is deferred to educator dashboard or future policy stages.

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

    if (!selectedChoice) return;

    // Stage 30: Check if this is a visual beat story with diagnostic mode
    const visualStory = isVisualBeatStory(story) ? story : null;
    const isDiagnostic = visualStory?.storyType === "diagnostic";

    // Stage 4B: Check if choice has branch beats
    const visualChoice = selectedChoice as VisualChoice;
    const hasBranchBeats = visualChoice.branchBeats && visualChoice.branchBeats.length > 0;

    // Show selection feedback (choice lock animation)
    // Stage 4B: Also queue branch beats if present
    setState((prev) => ({
      ...prev,
      selectedChoice: { id: choiceId, text: selectedChoice.text },
      branchBeatsToPlay: hasBranchBeats ? visualChoice.branchBeats! : null,
    }));

    // Stage 4B: If branch beats exist, they will play first
    // BranchBeatPlayer's onComplete will call advanceToNextCheckpoint
    if (hasBranchBeats) {
      // Branch beats will handle the flow - no immediate advance
      return;
    }

    if (isDiagnostic) {
      // Stage 30: Diagnostic mode - skip feedback overlay, proceed after brief delay
      setTimeout(() => {
        advanceToNextCheckpoint(choiceId);
      }, 400); // Brief pause for choice lock animation
    } else {
      // Stage 29/30: Training mode - show feedback overlay
      const visualChoice = selectedChoice as VisualChoice;
      const feedback = visualChoice.feedback ?? {
        xp: 1,
        encouragement: "You made a thoughtful choice.",
      };

      // Stage 30: Filter virtues to focused virtue only for training stories
      const rawVirtues = visualChoice.virtues ?? [];
      const focusedVirtue = visualStory?.focusedVirtue;
      const displayVirtues = focusedVirtue
        ? rawVirtues.filter(v => v === focusedVirtue)
        : rawVirtues;

      // Stage 32: Build training practice event (training stories only)
      // Always use currentCheckpoint.id, never derived from index (Refinement 2)
      const trainingEvent =
        visualStory?.storyType === "training" && focusedVirtue
          ? buildTrainingEvent(
              storyId,
              currentCheckpoint.id,
              choiceId,
              focusedVirtue,
              feedback.xp
            )
          : null;

      // Stage 32: Single setState for both activeFeedback and trainingProfile (Refinement 3)
      setState((prev) => ({
        ...prev,
        activeFeedback: {
          xp: feedback.xp,
          virtues: displayVirtues,
          encouragement: feedback.encouragement,
        },
        trainingProfile:
          trainingEvent && prev.trainingProfile
            ? {
                ...prev.trainingProfile,
                events: [...prev.trainingProfile.events, trainingEvent],
              }
            : prev.trainingProfile,
      }));
    }
  };

  // Stage 30: Helper function to advance to next checkpoint
  const advanceToNextCheckpoint = (choiceId: string) => {
    const currentIndex = state.checkpointIndex;
    const nextIndex = currentIndex + 1;
    const isLastCheckpoint = nextIndex >= totalCheckpoints;

    // Stage 31: Compute diagnostic profile on final checkpoint (internal only)
    let diagnosticProfile = state.diagnosticProfile;
    if (isLastCheckpoint && isVisualBeatStory(story) && story.storyType === "diagnostic") {
      const allChoices = [...state.choices, choiceId];
      diagnosticProfile = buildDiagnosticProfile(story.id, allChoices);
    }

    // Stage 33: Compute final training summary (consumed in later recommendation stages)
    let trainingSummary = state.trainingSummary;
    if (
      isLastCheckpoint &&
      isVisualBeatStory(story) &&
      story.storyType === "training" &&
      state.trainingProfile
    ) {
      trainingSummary = buildTrainingSummary(state.trainingProfile);
    }

    // Stage 34: Build recommendation candidates (consumed in later routing stages)
    let recommendations = state.recommendations;
    if (isLastCheckpoint) {
      // Use newly computed values if available, fall back to state
      const diagProfile = diagnosticProfile ?? state.diagnosticProfile;
      const trainSum = trainingSummary ?? state.trainingSummary;
      recommendations = buildRecommendations(diagProfile, trainSum);
    }

    // Stage 35: Resolve next-action intent ONLY.
    // IMPORTANT:
    // - This does NOT trigger navigation
    // - This does NOT assign a story
    // - Execution happens in a future routing stage (Stage 36)
    let nextAction = state.nextAction;
    if (isLastCheckpoint) {
      nextAction = resolveRecommendation(recommendations);
    }

    // Stage 36: Execute routing intent ONLY.
    // IMPORTANT:
    // - This does NOT navigate
    // - This does NOT assign a story
    // - This does NOT persist data
    // - Real routing happens in Stage 37
    let routingDecision = state.routingDecision;
    if (isLastCheckpoint) {
      routingDecision = executeNextAction(nextAction);
    }

    // Stage 37: Resolve final route
    let routeResult = state.routeResult;
    if (isLastCheckpoint && routingDecision) {
      routeResult = resolveRoute(routingDecision);
    }

    setState((prev) => ({ ...prev, isTransitioning: true }));

    // Stage 4B: Determine next stage
    // If last checkpoint and story has tacticalLoop, go to tactical stage
    let nextStage: Stage = isLastCheckpoint ? "ending" : "checkpoint";
    if (isLastCheckpoint && isVisualBeatStory(story) && story.tacticalLoop) {
      nextStage = "tactical";
    }

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        choices: [...prev.choices, choiceId],
        stage: nextStage,
        checkpointIndex: isLastCheckpoint ? currentIndex : nextIndex,
        selectedChoice: null,
        isTransitioning: false,
        checkpointNarrativeComplete: false, // Stage 26: Reset for next checkpoint
        activeFeedback: null, // Stage 29: Clear feedback
        branchBeatsToPlay: null, // Stage 4B: Clear branch beats
        diagnosticProfile, // Stage 31: Store computed profile
        trainingSummary, // Stage 33: Store computed summary
        recommendations, // Stage 34: Store computed candidates
        nextAction, // Stage 35: Stored intent only
        routingDecision, // Stage 36: Stored execution result only
        routeResult, // Stage 37: Final route result
        // Stage 4B: If going to tactical, set initial tactical stage
        tacticalStage: nextStage === "tactical" ? "intro" : prev.tacticalStage,
      }));
    }, 200);
  };

  // Stage 4B: Advance from auto-checkpoint (c3) WITHOUT adding to state.choices
  const advanceFromAutoCheckpoint = () => {
    const currentIndex = state.checkpointIndex;
    const nextIndex = currentIndex + 1;

    setState((prev) => ({
      ...prev,
      isTransitioning: true,
    }));

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        // NOTE: Does NOT add to choices - auto-checkpoint is not scored
        stage: "checkpoint",
        checkpointIndex: nextIndex,
        selectedChoice: null,
        isTransitioning: false,
        checkpointNarrativeComplete: false,
        branchBeatsToPlay: null,
        isAutoCheckpoint: false,
      }));
    }, 200);
  };

  // Stage 4B: Handler for when branch beats complete
  // Fix 4: Removed early branchBeatsToPlay clear - advanceToNextCheckpoint/advanceFromAutoCheckpoint
  // already handle this, and the early clear caused a decision screen flash
  const handleBranchBeatsComplete = () => {
    const choiceId = state.selectedChoice?.id;

    // If this was an auto-checkpoint, advance without adding to choices
    if (state.isAutoCheckpoint) {
      advanceFromAutoCheckpoint();
    } else if (choiceId) {
      // Normal choice - advance with the choice ID
      advanceToNextCheckpoint(choiceId);
    }
  };

  // Stage 4B: Handler to trigger auto-checkpoint branch beats
  const triggerAutoCheckpointBranch = () => {
    const currentCheckpoint = story.checkpoints[state.checkpointIndex];
    const visualCheckpoint = currentCheckpoint as import("@/data/visual-story").VisualCheckpoint;

    if (!visualCheckpoint.autoBranch) return;

    // Find which prior choice determines our branch
    const dependsOnId = visualCheckpoint.autoBranch.dependsOnCheckpointId;
    const priorChoice = state.choices.find(c => c.startsWith(dependsOnId + "-"));

    if (priorChoice && visualCheckpoint.autoBranch.beatsByChoiceId[priorChoice]) {
      const branchBeats = visualCheckpoint.autoBranch.beatsByChoiceId[priorChoice];
      setState((prev) => ({
        ...prev,
        branchBeatsToPlay: branchBeats,
        isAutoCheckpoint: true,
      }));
    } else {
      // No matching branch, advance anyway
      advanceFromAutoCheckpoint();
    }
  };

  // Stage 29: Handler for when feedback overlay completes
  const handleFeedbackComplete = () => {
    const choiceId = state.selectedChoice?.id;
    if (!choiceId) return;
    advanceToNextCheckpoint(choiceId);
  };

  // Stage 4B: Tactical loop handlers
  const handleTacticSelect = (tacticId: string) => {
    if (!isVisualBeatStory(story) || !story.tacticalLoop) return;

    const option = story.tacticalLoop.options.find(o => o.id === tacticId);
    if (!option) return;

    setState((prev) => ({
      ...prev,
      tacticalStage: "playing",
      currentTacticalBeats: option.beats,
      usedTactics: new Set([...prev.usedTactics, tacticId]),
      // NOTE: Does NOT modify state.choices - tactical loop is non-scoring
    }));
  };

  const handleTacticalIntroComplete = () => {
    setState((prev) => ({
      ...prev,
      tacticalStage: "selecting",
    }));
  };

  const handleTacticBeatsComplete = () => {
    if (!isVisualBeatStory(story) || !story.tacticalLoop) return;

    const baseTacticsCount = story.tacticalLoop.options.filter(o => !o.isHidden).length;
    const allBaseUsed = state.usedTactics.size >= baseTacticsCount;
    const hiddenOption = story.tacticalLoop.options.find(o => o.isHidden);
    const finalUsed = hiddenOption && state.usedTactics.has(hiddenOption.id);

    if (finalUsed) {
      // All done including final -> play conclusion
      setState((prev) => ({
        ...prev,
        tacticalStage: "conclusion",
        currentTacticalBeats: null,
      }));
    } else {
      // Return to menu (with "Archers again" revealed if allBaseUsed)
      setState((prev) => ({
        ...prev,
        tacticalStage: "selecting",
        currentTacticalBeats: null,
      }));
    }
  };

  const handleTacticalConclusionComplete = () => {
    // Proceed to ending stage
    setState((prev) => ({
      ...prev,
      stage: "ending",
      tacticalStage: "inactive",
      currentTacticalBeats: null,
    }));
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

  // Stage 44: Generate decision recap from last narrative beat(s)
  const getDecisionRecap = (sentences: string[]): string => {
    if (!sentences || sentences.length === 0) {
      return "You've reached an important moment in the story. Now it's time to choose what to do next.";
    }

    // Get last 1-2 non-dialogue sentences for context
    const nonDialogue = sentences.filter(
      (s) => !s.includes('"') && !s.includes("'")
    );
    const contextSentences =
      nonDialogue.length > 0 ? nonDialogue.slice(-2) : sentences.slice(-2);

    // Join and present as recap
    const recap = contextSentences.join(" ");

    // Fallback if empty
    if (!recap.trim()) {
      return "You've reached an important moment in the story. Now it's time to choose what to do next.";
    }

    return recap;
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
      {/* Stage 42: Added onBack for safe navigation before story starts (MC-3) */}
      {state.stage === "intro" && !hasStartedStory && (
        <StoryStartScreen
          title={story.title}
          subtitle={environment?.subtitle}
          gradientStyle={getStoryGradient(archetypeId, "intro")}
          storyType={isVisualBeatStory(story) ? story.storyType : undefined}
          focusedVirtue={isVisualBeatStory(story) ? story.focusedVirtue : undefined}
          onBegin={() => setHasStartedStory(true)}
          onBack={() => router.push("/student")}
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
          {/* Stage 4B: Branch beat playback takes priority */}
          {state.branchBeatsToPlay && state.branchBeatsToPlay.length > 0 ? (
            <BranchBeatPlayer
              beats={state.branchBeatsToPlay}
              archetypeId={archetypeId}
              stageType="checkpoint"
              stageIndex={state.checkpointIndex}
              onComplete={handleBranchBeatsComplete}
            />
          ) : !state.checkpointNarrativeComplete ? (
            /* Stage 26b: Show narrative pages FIRST, then choices */
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
              onComplete={() => {
                handleCheckpointNarrativeComplete();
                // Stage 4B: Check if this is an auto-checkpoint (c3)
                const currentCp = story.checkpoints[state.checkpointIndex];
                const visualCp = currentCp as import("@/data/visual-story").VisualCheckpoint;
                if (currentCp.choices.length === 0 && visualCp.autoBranch) {
                  // Auto-checkpoint: trigger branch beats after a brief delay
                  setTimeout(() => triggerAutoCheckpointBranch(), 200);
                }
              }}
              // Stage 27: Allow going back to intro from checkpoint 0
              allowPrevAtStart={state.checkpointIndex === 0}
              onPrevAtStart={state.checkpointIndex === 0 ? handleBackToIntro : undefined}
            />
          ) : (
            <>
              {/* Stage 4B: Skip choice UI for auto-checkpoints */}
              {story.checkpoints[state.checkpointIndex].choices.length > 0 ? (
                <>
                  {/* Stage 44: Decision recap and instruction */}
                  <div className="mb-6 space-y-3">
                    {/* Recap - derived from last narrative beat(s) */}
                    <p className="text-sm leading-relaxed text-zinc-600">
                      {getDecisionRecap(
                        storySegments.checkpointSentences[state.checkpointIndex]
                      )}
                    </p>
                    {/* Instruction */}
                    <p className="text-sm font-medium text-zinc-700">
                      Click one option below to choose what happens next.
                    </p>
                  </div>

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
              ) : null}
            </>
          )}
        </div>
      )}

      {/* Stage 4B: Tactical loop (after c5, before ending) */}
      {state.stage === "tactical" && isVisualBeatStory(story) && story.tacticalLoop && (
        <div
          className={`transition-opacity duration-200 ${
            state.isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <TacticalLoopUI
            tacticalLoop={story.tacticalLoop}
            usedTactics={state.usedTactics}
            stage={state.tacticalStage === "inactive" ? "intro" : state.tacticalStage}
            currentBeats={state.currentTacticalBeats}
            archetypeId={archetypeId}
            onTacticSelect={handleTacticSelect}
            onIntroComplete={handleTacticalIntroComplete}
            onBeatsComplete={handleTacticBeatsComplete}
            onConclusionComplete={handleTacticalConclusionComplete}
          />
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

      {/* Stage 29: Feedback Overlay */}
      {state.activeFeedback && (
        <FeedbackOverlay
          xp={state.activeFeedback.xp}
          virtues={state.activeFeedback.virtues}
          encouragement={state.activeFeedback.encouragement}
          onComplete={handleFeedbackComplete}
        />
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
                  Choose Another Story
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
