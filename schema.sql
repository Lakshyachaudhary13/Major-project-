-- Database Schema for Complaint Management System

-- Drop existing tables if they exist (WARNING: deletes data)
-- DROP TABLE IF EXISTS complaints;
-- DROP TABLE IF EXISTS admins;
-- DROP TABLE IF EXISTS students;
-- DROP TABLE IF EXISTS teachers;

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    gmail TEXT UNIQUE NOT NULL,
    "studentId" TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    gmail TEXT UNIQUE NOT NULL,
    "teacherId" TEXT UNIQUE NOT NULL,
    department TEXT,
    password TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
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

-- Basic RLS (Optional: Disable for easier setup, enable for production)
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for now (since the app handles auth via sessions/cookies)
-- NOTE: In a real app, you'd use Supabase Auth for better security.
CREATE POLICY "Allow all access" ON students FOR ALL USING (true);
CREATE POLICY "Allow all access" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow all access" ON admins FOR ALL USING (true);
CREATE POLICY "Allow all access" ON complaints FOR ALL USING (true);
