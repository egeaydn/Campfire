-- TEMPORARY: Disable RLS on conversations table for testing
-- This will help us confirm if RLS is the problem

ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Check if RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'conversations';

-- REMEMBER: Re-enable RLS after testing with:
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
