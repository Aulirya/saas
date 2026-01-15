-- Migration: add_recurring_schedule_to_course_progress
-- Created: 2026-01-XX
-- Description: Adds recurring schedule fields to course_progress table

-- Add recurring_schedule field (array of schedule objects)
DEFINE FIELD recurring_schedule ON TABLE course_progress TYPE array<object> DEFAULT [];
DEFINE FIELD recurring_schedule.*.day_of_week ON TABLE course_progress TYPE int; -- 1 = Monday, 7 = Sunday
DEFINE FIELD recurring_schedule.*.start_hour ON TABLE course_progress TYPE int; -- 0-23
DEFINE FIELD recurring_schedule.*.end_hour ON TABLE course_progress TYPE int; -- 0-23
DEFINE FIELD recurring_schedule.*.start_date ON TABLE course_progress TYPE datetime; -- When to start scheduling

-- Add auto_scheduled flag
DEFINE FIELD auto_scheduled ON TABLE course_progress TYPE bool DEFAULT false;