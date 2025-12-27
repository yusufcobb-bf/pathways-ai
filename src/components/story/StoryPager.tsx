"use client";

/**
 * Stage 26: Story Pager Component
 *
 * Paging controller that shows one sentence at a time.
 * Handles navigation between pages and completion callback.
 */

import { useState, useEffect } from "react";
import StoryPage from "./StoryPage";
import { getStoryGradient } from "@/data/story-environments";
import { getSentenceImageUrl } from "@/data/comic-illustrations";

export interface StoryPagerProps {
  sentences: string[];
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
  const totalPages = sentences.length;

  // V1: Reset page index when content changes to prevent index carryover
  // Stage 27: Use initialPage instead of always 0
  // Note: onPageChange intentionally excluded from deps to prevent infinite loop
  useEffect(() => {
    const startPage = Math.min(initialPage, sentences.length - 1);
    setCurrentPage(startPage);
    onPageChange?.(startPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences, archetypeId, stageType, initialPage]);

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

  const sentence = sentences[currentPage];
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
    />
  );
}
