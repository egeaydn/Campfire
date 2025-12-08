-- Check RLS policies for CONVERSATIONS table
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
WHERE tablename = 'conversations'
ORDER BY cmd;

-- Check if RLS is enabled on conversations
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'conversations';

-- Test: Can user 'mnege' see the conversation directly?
SELECT id, type, title, created_at 
FROM conversations 
WHERE id = '4c389952-d3bb-4f9c-9068-f1ffee2b4ffb';
