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
}: StoryPagerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = sentences.length;

  // V1: Reset page index when content changes to prevent index carryover
  // Note: onPageChange intentionally excluded from deps to prevent infinite loop
  useEffect(() => {
    setCurrentPage(0);
    onPageChange?.(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences, archetypeId, stageType]);

  if (totalPages === 0) {
    return null;
  }

  const handlePrev = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
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
  // For checkpoints, use "intro" type since we don't have checkpoint-specific images yet
  const imageUrl = getSentenceImageUrl(
    archetypeId,
    stageType === "checkpoint" ? "intro" : stageType,
    currentPage
  );

  // Stage 26b: Calculate display numbers (global if provided, otherwise local)
  const displayPageNumber = globalStartIndex + currentPage + 1;
  const displayTotalPages = totalStoryPages ?? totalPages;

  return (
    <StoryPage
      sentence={sentence}
      imageUrl={imageUrl}
      fallbackGradient={gradient}
      pageNumber={displayPageNumber}
      totalPages={displayTotalPages}
      onPrev={currentPage > 0 ? handlePrev : undefined}
      onNext={handleNext}
      isLast={isLast && !!onComplete}
    />
  );
}
