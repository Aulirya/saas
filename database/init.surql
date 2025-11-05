-- Initialize SurrealDB with namespace and database
-- This script runs when SurrealDB starts for the first time

-- Define the namespace
DEFINE NAMESPACE Aulirya;

-- Use the namespace
USE NS Aulirya;

-- Define the database
DEFINE DATABASE saas;

-- Use the database
USE DB saas;


-- ------------------------------
-- TABLE: classes
-- ------------------------------

DEFINE TABLE classes TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD created_at ON classes TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD level ON classes TYPE string PERMISSIONS FULL;
DEFINE FIELD name ON classes TYPE string PERMISSIONS FULL;
DEFINE FIELD school ON classes TYPE string PERMISSIONS FULL;
DEFINE FIELD students_count ON classes TYPE number PERMISSIONS FULL;
DEFINE FIELD updated_at ON classes TYPE datetime VALUE time::now() PERMISSIONS FULL;
DEFINE FIELD user_id ON classes TYPE record<users> PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: classes
-- ------------------------------


-- ------------------------------
-- TABLE: courses_progess
-- ------------------------------

DEFINE TABLE courses_progess TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD class_id ON courses_progess TYPE record<classes> PERMISSIONS FULL;
DEFINE FIELD created_at ON courses_progess TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD hours_done ON courses_progess TYPE number PERMISSIONS FULL;
DEFINE FIELD hours_per_week ON courses_progess TYPE number PERMISSIONS FULL;
DEFINE FIELD hours_remaining ON courses_progess TYPE number PERMISSIONS FULL;
DEFINE FIELD progress_percent ON courses_progess TYPE number PERMISSIONS FULL;
DEFINE FIELD status ON courses_progess TYPE 'backlog' | 'planned' | 'in progress' | 'done' | 'late' PERMISSIONS FULL;
DEFINE FIELD subject_id ON courses_progess TYPE record<subjects> PERMISSIONS FULL;
DEFINE FIELD updated_at ON courses_progess TYPE datetime VALUE time::now() PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: courses_progess
-- ------------------------------


-- ------------------------------
-- TABLE: lessons
-- ------------------------------

DEFINE TABLE lessons TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD average_duration ON lessons TYPE number PERMISSIONS FULL;
DEFINE FIELD class_id ON lessons TYPE record<classes> PERMISSIONS FULL;
DEFINE FIELD created_at ON lessons TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD date ON lessons TYPE datetime PERMISSIONS FULL;
DEFINE FIELD duration_minutes ON lessons TYPE number PERMISSIONS FULL;
DEFINE FIELD status ON lessons TYPE 'backlog' | 'planned' | 'in progress' | 'done' | 'late' PERMISSIONS FULL;
DEFINE FIELD subject_id ON lessons TYPE record<subjects> PERMISSIONS FULL;
DEFINE FIELD title ON lessons TYPE string PERMISSIONS FULL;
DEFINE FIELD user_id ON lessons TYPE record<users> PERMISSIONS FULL;
DEFINE FIELD updated_at ON lessons TYPE datetime VALUE time::now() PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: lessons
-- ------------------------------


-- ------------------------------
-- TABLE: subjects
-- ------------------------------

DEFINE TABLE subjects TYPE NORMAL SCHEMAFULL COMMENT 'subjects as Math2' PERMISSIONS NONE;

DEFINE FIELD created_at ON subjects TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD description ON subjects TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD hours_per_week ON subjects TYPE number PERMISSIONS FULL;
DEFINE FIELD name ON subjects TYPE string PERMISSIONS FULL;
DEFINE FIELD total_hours ON subjects TYPE number PERMISSIONS FULL;
DEFINE FIELD type ON subjects TYPE string PERMISSIONS FULL;
DEFINE FIELD updated_at ON subjects TYPE datetime VALUE time::now() PERMISSIONS FULL;
DEFINE FIELD user_id ON subjects TYPE record<users> PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: subjects
-- ------------------------------


-- ------------------------------
-- TABLE: users
-- ------------------------------

DEFINE TABLE users TYPE ANY SCHEMALESS PERMISSIONS NONE;

DEFINE FIELD created_at ON users TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD email ON users TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD first_name ON users TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD last_name ON users FLEXIBLE TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD role ON users TYPE 'teacher' | 'student' PERMISSIONS FULL;
DEFINE FIELD schools ON users TYPE array<string> PERMISSIONS FULL;
DEFINE FIELD schools[*] ON users TYPE string PERMISSIONS FULL;
DEFINE FIELD updated_at ON users TYPE datetime VALUE time::now() PERMISSIONS FULL;

