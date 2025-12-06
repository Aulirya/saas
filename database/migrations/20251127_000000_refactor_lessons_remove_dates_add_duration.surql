-- Migration: refactor lessons - remove dates, add duration, make label mandatory
-- Created: Wed Nov 27 00:00:00 CET 2025

-- Remove start_at and end_at fields
REMOVE FIELD start_at ON TABLE lessons;
REMOVE FIELD end_at ON TABLE lessons;

-- Add duration field (in minutes, default 60)
DEFINE FIELD duration ON TABLE lessons TYPE number DEFAULT 60;

-- Make label mandatory (change from option<string> to string)
-- Note: This will require updating existing records that have null labels
UPDATE lessons SET label = 'Leçon sans titre' WHERE label == NONE;

