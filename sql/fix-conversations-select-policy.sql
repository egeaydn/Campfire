-- FIX: Update conversations SELECT policy to allow members to see conversations

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Allow users to view their conversations" ON conversations;

-- Create the correct policy
CREATE POLICY "Users can view conversations they are members of"
ON conversations
FOR SELECT
TO public
USING (
  id IN (
    SELECT conversation_id 
    FROM conversation_members 
    WHERE user_id = auth.uid()
  )
);

-- Verify the fix
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'conversations' AND cmd = 'SELECT';
