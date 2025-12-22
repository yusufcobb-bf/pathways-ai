-- Migration: Add virtue_scores column to story_sessions
-- Run this in Supabase SQL Editor if you already have the table

alter table story_sessions
add column if not exists virtue_scores jsonb;
