-- Re-enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop the problematic policy if exists
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;

-- Create a better INSERT policy
-- This allows authenticated users to insert conversations
CREATE POLICY "Authenticated users can create conversations"
ON conversations FOR INSERT TO authenticated
WITH CHECK (true);

-- Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'conversations';

SELECT policyname, cmd, with_check
FROM pg_policies 
WHERE tablename = 'conversations' AND cmd = 'INSERT';
