"use client";

/**
 * Stage 4B: Tactical Loop UI Component
 *
 * Multi-select tactical UI for the Final Confrontation scene.
 * Player selects tactics in any order, sees their dialogue,
 * then returns to the menu with used tactics disabled.
 *
 * Flow:
 * 1. Show intro beats ("Crush them!")
 * 2. Display tactical menu with 5 options
 * 3. Player clicks tactic -> play its beats
 * 4. Return to menu with used tactic greyed out
 * 5. After all 5 used -> reveal "Archers again"
 * 6. After "Archers again" -> play conclusion -> proceed to ending
 *
 * NON-SCORING: Tactical selections do NOT affect state.choices
 */

import { TacticalLoop, VisualBeat } from "@/data/visual-story";
import BranchBeatPlayer from "./BranchBeatPlayer";

export type TacticalStage = "intro" | "selecting" | "playing" | "conclusion";

export interface TacticalLoopUIProps {
  tacticalLoop: TacticalLoop;
  usedTactics: Set<string>;
  stage: TacticalStage;
  currentBeats: VisualBeat[] | null;
  archetypeId: string;
  onTacticSelect: (tacticId: string) => void;
  onIntroComplete: () => void;
  onBeatsComplete: () => void;
  onConclusionComplete: () => void;
}

export default function TacticalLoopUI({
  tacticalLoop,
  usedTactics,
  stage,
  currentBeats,
  archetypeId,
  onTacticSelect,
  onIntroComplete,
  onBeatsComplete,
  onConclusionComplete,
}: TacticalLoopUIProps) {
  // Filter visible options: show all non-hidden, plus hidden ones if all 5 base tactics are used
  const baseTacticsCount = tacticalLoop.options.filter(o => !o.isHidden).length;
  const allBaseUsed = usedTactics.size >= baseTacticsCount;

  const visibleOptions = tacticalLoop.options.filter(
    opt => !opt.isHidden || allBaseUsed
  );

  // Intro stage: play intro beats
  if (stage === "intro") {
    return (
      <BranchBeatPlayer
        beats={tacticalLoop.introBeats}
        archetypeId={archetypeId}
        stageType="checkpoint"
        onComplete={onIntroComplete}
      />
    );
  }

  // Playing stage: play current tactic's beats
  if (stage === "playing" && currentBeats) {
    return (
      <BranchBeatPlayer
        beats={currentBeats}
        archetypeId={archetypeId}
        stageType="checkpoint"
        onComplete={onBeatsComplete}
      />
    );
  }

  // Conclusion stage: play conclusion beats
  if (stage === "conclusion") {
    return (
      <BranchBeatPlayer
        beats={tacticalLoop.conclusionBeats}
        archetypeId={archetypeId}
        stageType="ending"
        onComplete={onConclusionComplete}
      />
    );
  }

  // Selecting stage: show tactical menu
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-zinc-900">
          Choose Your Tactics
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          Click each tactic to deploy it. ({usedTactics.size}/{baseTacticsCount} used)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {visibleOptions.map((option) => {
          const isUsed = usedTactics.has(option.id);
          const isFinalOption = option.isHidden; // "Archers again"

          return (
            <button
              key={option.id}
              onClick={() => !isUsed && onTacticSelect(option.id)}
              disabled={isUsed}
              className={`rounded-lg border p-4 text-center transition-all ${
                isUsed
                  ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                  : isFinalOption
                  ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-500 hover:bg-amber-100"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50"
              }`}
            >
              <span className={isUsed ? "line-through" : ""}>
                {option.label}
              </span>
              {isUsed && (
                <span className="ml-2 text-green-500">✓</span>
              )}
              {isFinalOption && !isUsed && (
                <span className="ml-2">⚔️</span>
              )}
            </button>
          );
        })}
      </div>

      {allBaseUsed && !usedTactics.has(tacticalLoop.options.find(o => o.isHidden)?.id ?? "") && (
        <p className="text-center text-sm font-medium text-amber-700">
          All tactics deployed! Choose your final move.
        </p>
      )}
    </div>
  );
}
