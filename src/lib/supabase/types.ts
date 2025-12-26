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
  username?: string | null; // Stage 21b: For educator roster display
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

// Stage 21: Classrooms & Rosters
export interface Classroom {
  id: string;
  name: string;
  educator_id: string;
  join_code: string;
  created_at: string;
}

export interface ClassroomMember {
  id: string;
  classroom_id: string;
  student_id: string;
  joined_at: string;
}

// For educator roster display (joined with profiles)
export interface ClassroomMemberWithProfile {
  id: string;
  classroom_id: string;
  student_id: string;
  joined_at: string;
  profiles: {
    user_id: string;
    username?: string | null;
  } | null;
}

// For student classroom list (joined with classroom)
export interface StudentClassroomMembership {
  id: string;
  classroom_id: string;
  joined_at: string;
  classrooms: {
    id: string;
    name: string;
  } | null;
}

// Stage 22: Assignments
export interface Assignment {
  id: string;
  classroom_id: string;
  educator_id: string;
  title: string;
  archetype_id: string;
  variant_id?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  guided_reflection_override?: boolean | null;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  session_id?: string | null;
  status: "assigned" | "completed";
  created_at: string;
  completed_at?: string | null;
}
