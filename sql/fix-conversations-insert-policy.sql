-- Fix: Add INSERT policy for conversations table
-- This allows authenticated users to create new conversations

-- First, check if there's an existing INSERT policy
-- If there is, we'll drop it and create a better one

DROP POLICY IF EXISTS "Allow users to create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON conversations;

-- Create a new INSERT policy that allows authenticated users to create conversations
-- The user creating the conversation must be the created_by user
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- Verify the policy was created
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'conversations' 
AND cmd = 'INSERT';
