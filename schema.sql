
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    gmail TEXT UNIQUE NOT NULL,
    "studentId" TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    gmail TEXT UNIQUE NOT NULL,
    "teacherId" TEXT UNIQUE NOT NULL,
    department TEXT,
    password TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE POLICY "Allow all access" ON students FOR ALL USING (true);
CREATE POLICY "Allow all access" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow all access" ON admins FOR ALL USING (true);
CREATE POLICY "Allow all access" ON complaints FOR ALL USING (true);
