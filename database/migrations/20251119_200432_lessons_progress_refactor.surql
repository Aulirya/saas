-- Migration: lessons_progress_refactor
-- Created: Wed Nov 19 20:04:32 CET 2025


-- Migration: lessons_course_progresss_schema
-- Created: Tue Nov 18 20:43:27 CET 2025


-- remove lessons TABLE and course_progress TABLE
-- they need to be refoactored
REMOVE TABLE lessons;
REMOVE TABLE courses_progess;

-- fix users table, it should be schemafull
DEFINE TABLE OVERWRITE users TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

-- new lessons TABLE
DEFINE TABLE lessons PERMISSIONS none;
-- mandatory
DEFINE FIELD subject_id ON TABLE lessons TYPE record<subjects>;
DEFINE FIELD user_id ON TABLE lessons TYPE record<users>;
DEFINE FIELD description ON TABLE lessons TYPE string;

DEFINE FIELD comments ON TABLE lessons TYPE array<object>;
-- DEFINE comment OBJECT
DEFINE FIELD comments.*.title        ON TABLE lessons TYPE option<string>;
DEFINE FIELD comments.*.description  ON TABLE lessons TYPE string;
DEFINE FIELD comments.*.created_at   ON TABLE lessons TYPE datetime VALUE time::now();
DEFINE FIELD comments.*.updated_at   ON TABLE lessons TYPE datetime VALUE time::now();

-- not mandatory
DEFINE FIELD label ON TABLE lessons TYPE option<string>;
DEFINE FIELD start_at ON TABLE lessons TYPE option<datetime>;
DEFINE FIELD end_at ON TABLE lessons TYPE option<datetime>;

-- system value
DEFINE FIELD created_at ON TABLE lessons TYPE datetime VALUE time::now();
DEFINE FIELD updated_at ON TABLE lessons TYPE datetime VALUE time::now();

-- new course_progress TABLE
DEFINE TABLE course_progress PERMISSIONS none;

-- mandatory fields
DEFINE FIELD class_id ON TABLE course_progress TYPE record<classes>;
DEFINE FIELD subject_id ON TABLE course_progress TYPE record<subjects>;
