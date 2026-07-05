-- Migration: 0003_add_password_hash.sql
-- Description: Add password_hash column to app_users table for custom JWT-based authentication

ALTER TABLE app_users ADD COLUMN password_hash text NULL;
