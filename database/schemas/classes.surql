-- Define the classes table
DEFINE TABLE classes TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

-- Define fields
DEFINE FIELD created_at ON classes TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD level ON classes TYPE string PERMISSIONS FULL;
DEFINE FIELD name ON classes TYPE string PERMISSIONS FULL;
DEFINE FIELD school ON classes TYPE string PERMISSIONS FULL;
DEFINE FIELD students_count ON classes TYPE number PERMISSIONS FULL;
DEFINE FIELD updated_at ON classes TYPE datetime VALUE time::now() PERMISSIONS FULL;
DEFINE FIELD user_id ON classes TYPE record<users> PERMISSIONS FULL;
