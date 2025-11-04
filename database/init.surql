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

-- Define the users table
DEFINE TABLE users;
