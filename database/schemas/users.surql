-- Define the users table
DEFINE TABLE users TYPE ANY SCHEMALESS PERMISSIONS NONE;

-- Define fields
DEFINE FIELD created_at ON users TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD email ON users TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD first_name ON users TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD last_name ON users FLEXIBLE TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD role ON users TYPE 'teacher' | 'student' PERMISSIONS FULL;
DEFINE FIELD schools ON users TYPE array<string> PERMISSIONS FULL;
DEFINE FIELD schools[*] ON users TYPE string PERMISSIONS FULL;
DEFINE FIELD country ON users TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD updated_at ON users TYPE datetime VALUE time::now() PERMISSIONS FULL;

