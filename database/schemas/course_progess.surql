-- Define the course_progress table
-- This table tracks the progress of a course (subject) for a specific class
-- Each record represents a unique combination of class + subject + user (teacher)
DEFINE TABLE course_progress PERMISSIONS none;

-- mandatory fields
DEFINE FIELD class_id ON TABLE course_progress TYPE record<classes>;
DEFINE FIELD subject_id ON TABLE course_progress TYPE record<subjects>;
DEFINE FIELD user_id ON TABLE course_progress TYPE record<users>;

-- status field to track course progress state
-- not_started: Course hasn't started yet
-- in_progress: Course is currently being taught
-- completed: Course is finished
-- on_hold: Course is temporarily paused
DEFINE FIELD status ON TABLE course_progress TYPE string DEFAULT 'not_started';

-- system timestamps
DEFINE FIELD created_at ON TABLE course_progress TYPE datetime VALUE time::now();
DEFINE FIELD updated_at ON TABLE course_progress TYPE datetime VALUE time::now();
