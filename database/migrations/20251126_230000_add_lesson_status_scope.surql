-- Migration: add status and scope to lessons
-- Created: Wed Nov 26 23:00:00 CET 2025

-- Add status and scope fields to lessons table
DEFINE FIELD status ON TABLE lessons TYPE option<string>;
DEFINE FIELD scope ON TABLE lessons TYPE option<string>;


