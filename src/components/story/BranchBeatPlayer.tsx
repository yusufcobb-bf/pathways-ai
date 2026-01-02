"use client";

/**
 * Stage 4B: Branch Beat Player Component
 *
 * Renders a sequence of VisualBeat objects with full beat rendering
 * (actor, focus, casel, illustrations). Used for:
 * - Choice branch beats (after player selects a choice)
 * - Auto-checkpoint branch beats (c3 conditional)
 * - Tactical loop beats
 *
 * Reuses StoryPage for consistent rendering with the main story flow.
 */

import { useState, useEffect } from "react";
import StoryPage from "./StoryPage";
import { VisualBeat } from "@/data/visual-story";
import { getStoryGradient } from "@/data/story-environments";

export interface BranchBeatPlayerProps {
  beats: VisualBeat[];
  archetypeId: string;
  stageType?: "intro" | "checkpoint" | "ending";
  stageIndex?: number;
  onComplete: () => void;
  // Optional: for progress display
  showProgress?: boolean;
}

export default function BranchBeatPlayer({
  beats,
  archetypeId,
  stageType = "checkpoint",
  stageIndex = 0,
  onComplete,
  showProgress = true,
}: BranchBeatPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset when beats change
  useEffect(() => {
    setCurrentIndex(0);
  }, [beats]);

  if (!beats || beats.length === 0) {
    // No beats to play, complete immediately
    onComplete();
    return null;
  }

  const currentBeat = beats[currentIndex];
  const totalBeats = beats.length;
  const isLast = currentIndex === totalBeats - 1;

  // Defensive guard: ensure beat has text (Fix 1A)
  const safeText = currentBeat?.text ?? "";
  if (!safeText && process.env.NODE_ENV === "development") {
    console.warn(`BranchBeatPlayer: Beat at index ${currentIndex} missing text`, currentBeat);
  }

  // Get gradient for visual consistency
  const gradientIndex = stageType === "ending" ? 3 : stageIndex;
  const gradient =
    getStoryGradient(archetypeId, gradientIndex) ||
    "linear-gradient(to bottom right, #f4f4f5, #e4e4e7)";

  // Branch beats currently use gradient background (no pre-generated images)
  // Future: could use beat.illustrationHint for dynamic image generation
  const imageUrl = undefined;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalBeats - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <StoryPage
      sentence={safeText}
      imageUrl={imageUrl}
      fallbackGradient={gradient}
      pageNumber={showProgress ? currentIndex + 1 : 1}
      totalPages={showProgress ? totalBeats : 1}
      onPrev={currentIndex > 0 ? handlePrev : undefined}
      onNext={handleNext}
      isLast={isLast}
      // Stage 5: Pass visual metadata for placeholder card
      beatMeta={{
        location: currentBeat?.location,
        shot: currentBeat?.shot,
        mood: currentBeat?.mood,
        actor: currentBeat?.actor,
        props: currentBeat?.props,
        illustrationKey: currentBeat?.illustrationKey,
      }}
    />
  );
}
