-- Define the lessons table
DEFINE TABLE lessons TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

-- Define fields
DEFINE FIELD average_duration ON lessons TYPE number PERMISSIONS FULL;
DEFINE FIELD class_id ON lessons TYPE record<classes> PERMISSIONS FULL;
DEFINE FIELD created_at ON lessons TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD date ON lessons TYPE option<datetime> PERMISSIONS FULL;
DEFINE FIELD duration_minutes ON lessons TYPE number PERMISSIONS FULL;
DEFINE FIELD status ON lessons TYPE 'backlog' | 'planned' | 'in progress' | 'done' | 'late' PERMISSIONS FULL;
DEFINE FIELD subject_id ON lessons TYPE record<subjects> PERMISSIONS FULL;
DEFINE FIELD title ON lessons TYPE string PERMISSIONS FULL;
DEFINE FIELD user_id ON lessons TYPE record<users> PERMISSIONS FULL;
DEFINE FIELD updated_at ON lessons TYPE datetime VALUE time::now() PERMISSIONS FULL;
