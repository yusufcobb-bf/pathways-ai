-- Stage 16: Guided Reflection & Discussion Layer
-- Adds structured reflection prompts after story completion

-- Add guided_responses column to story_sessions
alter table story_sessions
add column if not exists guided_responses jsonb;

-- Add guided_reflection_enabled to story_pool_config (opt-in, default false)
alter table story_pool_config
add column if not exists guided_reflection_enabled boolean default false;
