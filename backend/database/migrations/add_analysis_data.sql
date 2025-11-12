-- Add analysis_data column to cases table
ALTER TABLE cases ADD COLUMN analysis_data TEXT AFTER win_probability;
