-- FIX: Update INSERT policy to allow any authenticated user to create conversations
-- The created_by field can be set to any user ID by authenticated users

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Authenticated users can create conversations"
ON conversations FOR INSERT TO authenticated
WITH CHECK (true);

-- Verify
SELECT policyname, cmd, with_check
FROM pg_policies 
WHERE tablename = 'conversations' AND cmd = 'INSERT';
