-- Migration: addCountryToUser
-- Created: Fri Jan  9 14:54:02 CET 2026

-- Add country field to users table
DEFINE FIELD country ON TABLE users TYPE option<string>;
