-- Add sort_order column to service_options table
ALTER TABLE service_options ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
