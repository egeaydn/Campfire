-- Check RLS policies for conversation_members
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'conversation_members'
ORDER BY cmd;

-- Check if RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'conversation_members';

-- Test: Get all conversations for user 'mnege'
-- First get mnege's user_id
SELECT id, username FROM profiles WHERE username = 'mnege';

-- Then check their conversation_members
-- SELECT * FROM conversation_members WHERE user_id = 'MNEGE_USER_ID_HERE';
