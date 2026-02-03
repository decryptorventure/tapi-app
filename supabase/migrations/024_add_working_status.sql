-- Add 'working' status to application_status enum
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'working';
