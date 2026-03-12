-- 🛠️ SUPABASE REPAIR SCRIPT 🛠️
-- Run this in your Supabase SQL Editor to fix "Table Not Found" (PGRST205) errors.

-- 1. Ensure we are in the public schema
SET search_path TO public;

-- 2. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. (Re)Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    gmail TEXT UNIQUE NOT NULL,
    "studentId" TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. (Re)Create Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    gmail TEXT UNIQUE NOT NULL,
    "teacherId" TEXT UNIQUE NOT NULL,
    department TEXT,
    password TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. (Re)Create Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. (Re)Create Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentEmail" TEXT,
    "studentGmail" TEXT,
    type TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "resolutionNotes" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP WITH TIME ZONE
);

-- 7. Grant Permissions to API Roles (CRITICAL)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Enable RLS and Create Policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Allow all access" ON students;
DROP POLICY IF EXISTS "Allow all access" ON teachers;
DROP POLICY IF EXISTS "Allow all access" ON admins;
DROP POLICY IF EXISTS "Allow all access" ON complaints;

CREATE POLICY "Allow all access" ON students FOR ALL USING (true);
CREATE POLICY "Allow all access" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow all access" ON admins FOR ALL USING (true);
CREATE POLICY "Allow all access" ON complaints FOR ALL USING (true);

-- 9. 🚀 FORCE RELOAD SCHEMA CACHE
-- This tells Supabase PostgREST to look for the tables again immediately.
SELECT pg_notification_queue_usage();
NOTIFY pgrst, 'reload schema';
