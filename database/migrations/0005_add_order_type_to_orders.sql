-- Add order_type column to orders table
ALTER TABLE orders ADD COLUMN order_type text NOT NULL DEFAULT 'online';
