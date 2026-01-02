"use client";

/**
 * Stage 26: Story Pager Component
 * Stage 5: Added beats support with backward compat
 *
 * Paging controller that shows one sentence at a time.
 * Handles navigation between pages and completion callback.
 * Supports both beats (with visual metadata) and legacy sentences.
 */

import { useState, useEffect } from "react";
import StoryPage from "./StoryPage";
import { VisualBeat } from "@/data/visual-story";
import { getStoryGradient } from "@/data/story-environments";
import { getSentenceImageUrl } from "@/data/comic-illustrations";

export interface StoryPagerProps {
  // Stage 5: Support both beats and sentences (backward compat)
  beats?: VisualBeat[]; // New: full beat objects with metadata
  sentences?: string[]; // Legacy: plain text array
  archetypeId: string;
  stageType?: "intro" | "checkpoint" | "ending";
  stageIndex?: number; // For checkpoint gradient variation
  onComplete?: () => void;
  // Stage 26b: Global progress tracking
  globalStartIndex?: number;
  totalStoryPages?: number;
  onPageChange?: (localIndex: number) => void;
  // Stage 27: Cross-stage navigation
  allowPrevAtStart?: boolean; // Show Previous button even on page 0
  onPrevAtStart?: () => void; // Called when Previous clicked on page 0
  initialPage?: number; // Start at a specific page (for back navigation)
}

export default function StoryPager({
  beats,
  sentences,
  archetypeId,
  stageType = "intro",
  stageIndex = 0,
  onComplete,
  globalStartIndex = 0,
  totalStoryPages,
  onPageChange,
  allowPrevAtStart = false,
  onPrevAtStart,
  initialPage = 0,
}: StoryPagerProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Stage 5: Use beats if provided, otherwise fall back to sentences
  const useBeats = !!beats && beats.length > 0;
  const totalPages = useBeats ? beats.length : (sentences?.length ?? 0);

  // V1: Reset page index when content changes to prevent index carryover
  // Stage 27: Use initialPage instead of always 0
  // Note: onPageChange intentionally excluded from deps to prevent infinite loop
  useEffect(() => {
    const maxPage = totalPages > 0 ? totalPages - 1 : 0;
    const startPage = Math.min(initialPage, maxPage);
    setCurrentPage(startPage);
    onPageChange?.(startPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beats, sentences, archetypeId, stageType, initialPage, totalPages]);

  if (totalPages === 0) {
    return null;
  }

  const handlePrev = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    } else if (allowPrevAtStart && onPrevAtStart) {
      // On page 0 but allowed to go back to previous stage
      onPrevAtStart();
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    } else if (onComplete) {
      onComplete();
    }
  };

  // Stage 5: Get current beat (if using beats) or sentence (legacy)
  const currentBeat = useBeats ? beats[currentPage] : undefined;
  const sentence = useBeats
    ? (currentBeat?.text ?? "")
    : (sentences?.[currentPage] ?? "");
  const isLast = currentPage === totalPages - 1;

  // Get gradient - vary by stage for visual interest
  const gradientIndex = stageType === "ending" ? 3 : stageIndex;
  const gradient =
    getStoryGradient(archetypeId, gradientIndex) ||
    "linear-gradient(to bottom right, #f4f4f5, #e4e4e7)";

  // Check for pre-generated image
  // Stage 28c: Pass checkpoint identity for unique checkpoint images
  const imageUrl = getSentenceImageUrl(
    archetypeId,
    stageType === "checkpoint" ? "checkpoint" : stageType,
    currentPage,
    stageType === "checkpoint" ? `c${stageIndex + 1}` : undefined
  );

  // Stage 26b: Calculate display numbers (global if provided, otherwise local)
  const displayPageNumber = globalStartIndex + currentPage + 1;
  const displayTotalPages = totalStoryPages ?? totalPages;

  // Show Previous button if:
  // 1. We're not on page 0 (normal case), OR
  // 2. We're on page 0 but cross-stage navigation is allowed
  const showPrev = currentPage > 0 || (allowPrevAtStart && !!onPrevAtStart);

  return (
    <StoryPage
      sentence={sentence}
      imageUrl={imageUrl}
      fallbackGradient={gradient}
      pageNumber={displayPageNumber}
      totalPages={displayTotalPages}
      onPrev={showPrev ? handlePrev : undefined}
      onNext={handleNext}
      isLast={isLast && !!onComplete}
      // Stage 5: Pass visual metadata when using beats
      beatMeta={
        currentBeat
          ? {
              location: currentBeat.location,
              shot: currentBeat.shot,
              mood: currentBeat.mood,
              actor: currentBeat.actor,
              props: currentBeat.props,
              illustrationKey: currentBeat.illustrationKey,
            }
          : undefined
      }
    />
  );
}
