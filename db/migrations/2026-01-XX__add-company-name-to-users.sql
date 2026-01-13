-- Migration: Add company_name column to users table
-- Date: 2026-01-XX
-- Description: Adds company_name column to public.users table to store company information

-- Add company_name column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.company_name IS 'Company name provided during registration';
