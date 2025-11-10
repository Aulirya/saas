-- Define the courses_progess table
DEFINE TABLE courses_progess TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

-- Define fields
DEFINE FIELD class_id ON courses_progess TYPE record<classes> PERMISSIONS FULL;
DEFINE FIELD created_at ON courses_progess TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD hours_done ON courses_progess TYPE number PERMISSIONS FULL;
DEFINE FIELD hours_per_week ON courses_progess TYPE number PERMISSIONS FULL;
DEFINE FIELD hours_remaining ON courses_progess TYPE number PERMISSIONS FULL;
DEFINE FIELD progress_percent ON courses_progess TYPE number PERMISSIONS FULL;
DEFINE FIELD status ON courses_progess TYPE 'backlog' | 'planned' | 'in progress' | 'done' | 'late' PERMISSIONS FULL;
DEFINE FIELD subject_id ON courses_progess TYPE record<subjects> PERMISSIONS FULL;
DEFINE FIELD updated_at ON courses_progess TYPE datetime VALUE time::now() PERMISSIONS FULL;
