import { VirtueScores } from "@/data/virtues";

export interface Profile {
  id: string;
  user_id: string;
  created_at: string;
}

export interface StorySession {
  id: string;
  user_id: string;
  story_id: string;
  choices: string[];
  reflection: string | null;
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
