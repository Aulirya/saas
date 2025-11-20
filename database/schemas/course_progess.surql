-- Define the course_progess table
DEFINE TABLE course_progress PERMISSIONS none;

-- mandatory fields
DEFINE FIELD class_id ON TABLE course_progress TYPE record<classes>;
DEFINE FIELD subject_id ON TABLE course_progress TYPE record<subjects>;
