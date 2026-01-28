-- Define the lesson_progress table
-- This table tracks the progress of individual lessons within a course_progress
-- Each record represents a lesson being tracked for a specific class-subject combination
-- This allows teachers to track which lessons have been completed, scheduled, or need attention
DEFINE TABLE lesson_progress PERMISSIONS none;

-- mandatory fields
DEFINE FIELD lesson_id ON TABLE lesson_progress TYPE record<lessons>;
DEFINE FIELD course_progress_id ON TABLE lesson_progress TYPE record<course_progress>;

-- status field to track lesson progress state
-- not_started: Lesson hasn't been scheduled or started
-- scheduled: Lesson is scheduled for a future date
-- in_progress: Lesson is currently being taught
-- completed: Lesson has been completed
-- skipped: Lesson was skipped (not taught)
DEFINE FIELD status ON TABLE lesson_progress TYPE string DEFAULT 'not_started';

-- optional fields
-- scheduled_date: When the lesson is planned to be taught (if status is 'scheduled')
DEFINE FIELD scheduled_date ON TABLE lesson_progress TYPE option<datetime>;

-- completed_at: Timestamp when the lesson was marked as completed
DEFINE FIELD completed_at ON TABLE lesson_progress TYPE option<datetime>;

-- comments: Array of comments/notes for this lesson
-- Teachers can add multiple comments to track observations, issues, or notes
-- Each comment has a title (optional) and description (required)
DEFINE FIELD comments ON TABLE lesson_progress TYPE array<object> DEFAULT [];
DEFINE FIELD comments.*.title ON TABLE lesson_progress TYPE option<string>;
DEFINE FIELD comments.*.description ON TABLE lesson_progress TYPE string;
DEFINE FIELD comments.*.created_at ON TABLE lesson_progress TYPE datetime VALUE time::now();
DEFINE FIELD comments.*.updated_at ON TABLE lesson_progress TYPE datetime VALUE time::now();

-- system timestamps
DEFINE FIELD created_at ON TABLE lesson_progress TYPE datetime VALUE time::now();
DEFINE FIELD updated_at ON TABLE lesson_progress TYPE datetime VALUE time::now();

