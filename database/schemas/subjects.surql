-- Define the subjects table
DEFINE TABLE subjects TYPE NORMAL SCHEMAFULL COMMENT 'subjects as Math2' PERMISSIONS NONE;

-- Define fields
DEFINE FIELD created_at ON subjects TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD description ON subjects TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD hours_per_week ON subjects TYPE number PERMISSIONS FULL;
DEFINE FIELD name ON subjects TYPE string PERMISSIONS FULL;
DEFINE FIELD total_hours ON subjects TYPE number PERMISSIONS FULL;
DEFINE FIELD type ON subjects TYPE string PERMISSIONS FULL;
DEFINE FIELD updated_at ON subjects TYPE datetime VALUE time::now() PERMISSIONS FULL;
DEFINE FIELD user_id ON subjects TYPE record<users> PERMISSIONS FULL;
