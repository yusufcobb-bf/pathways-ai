import { VirtueScores } from "@/data/virtues";

// Stage 12: User roles for RBAC
export type UserRole = "student" | "educator";

// Stage 16: Guided Reflection types
export interface GuidedPromptResponse {
  prompt: string;
  response: string;
}

export interface GuidedResponses {
  prompts: GuidedPromptResponse[];
  archetypeId: string;
  completedAt: string;
}

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface StorySession {
  id: string;
  user_id: string;
  story_id: string;
  variant_id: string | null; // Stage 8: Which variant was played (null = base story)
  choices: string[];
  reflection: string | null;
  guided_responses: GuidedResponses | null; // Stage 16: Structured reflection responses
  virtue_scores: VirtueScores | null;
  created_at: string;
}

// Story Pool Configuration
export type StoryMode = "fixed_sequence" | "single_story" | "shuffled_sequence";

export interface StoryPoolConfig {
  id: string;
  enabled_story_ids: string[];
  story_order: string[];
  mode: StoryMode;
  single_story_id: string | null; // Stage 10: Explicit story selection for single_story mode
  guided_reflection_enabled: boolean; // Stage 16: Opt-in for guided prompts (default false)
  created_at: string;
  updated_at: string;
}

// Per-student shuffle state for shuffled_sequence mode
export interface StudentStoryCycle {
  user_id: string;
  cycle_index: number;
  shuffled_order: string[];
  created_at: string;
  updated_at: string;
}
