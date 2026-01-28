-- Initial : adapt Subjects table
-- created_at : Tue Nov 25 20:43:27 CET 2022



-- Subjects table
DEFINE FIELD category ON subjects TYPE 
  | 'Mathematics'
  | 'Language' 
  | 'Science' 
  | 'Social' 
  | 'Literature'
  | 'Sport'
  | 'History'
  | 'Geography'
  | 'Philosophy'
  | 'Civic'
  | 'Music'
  | 'Art'
  | 'Technology'
  | 'Computer Science'
  | 'Economics'
  | 'Other'
  PERMISSIONS FULL;
REMOVE FIELD hours_per_week ON subjects;
REMOVE FIELD total_hours ON subjects;

