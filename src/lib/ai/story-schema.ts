import { z } from "zod";

// Choice schema - validates individual choices within checkpoints
const choiceSchema = z.object({
  id: z.string().regex(/^c[1-3]-[abc]$/, "Choice ID must follow pattern: c1-a, c2-b, etc."),
  text: z.string().min(10, "Choice text must be at least 10 characters"),
});

// Checkpoint schema - validates each story checkpoint
const checkpointSchema = z.object({
  id: z.string().regex(/^c[1-3]$/, "Checkpoint ID must be c1, c2, or c3"),
  prompt: z.string().min(50, "Checkpoint prompt must be at least 50 characters"),
  choices: z
    .array(choiceSchema)
    .min(2, "Each checkpoint must have at least 2 choices")
    .max(3, "Each checkpoint must have at most 3 choices"),
});

// Full generated story schema
export const generatedStorySchema = z.object({
  id: z.string().min(1, "Story must have an ID"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  intro: z.string().min(100, "Intro must be at least 100 characters"),
  checkpoints: z
    .array(checkpointSchema)
    .length(3, "Story must have exactly 3 checkpoints"),
  ending: z.string().min(50, "Ending must be at least 50 characters"),
});

// TypeScript types derived from the schema
export type GeneratedChoice = z.infer<typeof choiceSchema>;
export type GeneratedCheckpoint = z.infer<typeof checkpointSchema>;
export type GeneratedStory = z.infer<typeof generatedStorySchema>;

// Validate a story object against the schema
export function validateGeneratedStory(data: unknown): GeneratedStory {
  return generatedStorySchema.parse(data);
}

// Safe validation that returns result instead of throwing
export function safeValidateGeneratedStory(data: unknown): {
  success: boolean;
  data?: GeneratedStory;
  error?: z.ZodError;
} {
  const result = generatedStorySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
