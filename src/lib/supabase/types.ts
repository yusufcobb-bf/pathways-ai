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
