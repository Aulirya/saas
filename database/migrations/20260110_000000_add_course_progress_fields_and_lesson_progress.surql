-- Migration: add_course_progress_fields_and_lesson_progress
-- Created: 2026-01-10
-- Description: Adds missing fields to course_progress table and creates lesson_progress table

-- Add missing fields to course_progress table
DEFINE FIELD user_id ON TABLE course_progress TYPE record<users>;
DEFINE FIELD status ON TABLE course_progress TYPE string DEFAULT 'not_started';
DEFINE FIELD created_at ON TABLE course_progress TYPE datetime VALUE time::now();
DEFINE FIELD updated_at ON TABLE course_progress TYPE datetime VALUE time::now();

-- Create lesson_progress table
-- This table tracks individual lesson progress within a course_progress
DEFINE TABLE lesson_progress PERMISSIONS none;

-- mandatory fields
DEFINE FIELD lesson_id ON TABLE lesson_progress TYPE record<lessons>;
DEFINE FIELD course_progress_id ON TABLE lesson_progress TYPE record<course_progress>;

-- status field to track lesson progress state
DEFINE FIELD status ON TABLE lesson_progress TYPE string DEFAULT 'not_started';

-- optional fields
DEFINE FIELD scheduled_date ON TABLE lesson_progress TYPE option<datetime>;
DEFINE FIELD completed_at ON TABLE lesson_progress TYPE option<datetime>;

-- comments array for lesson notes
DEFINE FIELD comments ON TABLE lesson_progress TYPE array<object> DEFAULT [];
DEFINE FIELD comments.*.title ON TABLE lesson_progress TYPE option<string>;
DEFINE FIELD comments.*.description ON TABLE lesson_progress TYPE string;
DEFINE FIELD comments.*.created_at ON TABLE lesson_progress TYPE datetime VALUE time::now();
DEFINE FIELD comments.*.updated_at ON TABLE lesson_progress TYPE datetime VALUE time::now();

-- system timestamps
DEFINE FIELD created_at ON TABLE lesson_progress TYPE datetime VALUE time::now();
DEFINE FIELD updated_at ON TABLE lesson_progress TYPE datetime VALUE time::now();

