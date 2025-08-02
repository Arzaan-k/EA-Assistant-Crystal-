-- Add last_email_sync column to users table
ALTER TABLE users ADD COLUMN last_email_sync TIMESTAMP;
