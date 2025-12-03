-- Debug script: Check conversation members for a specific conversation

-- Replace 'YOUR_CONVERSATION_ID' with actual conversation ID
SELECT 
  cm.id,
  cm.conversation_id,
  cm.user_id,
  cm.role,
  cm.joined_at,
  p.username,
  p.display_name,
  p.avatar_url
FROM conversation_members cm
LEFT JOIN profiles p ON p.id = cm.user_id
WHERE cm.conversation_id = 'YOUR_CONVERSATION_ID'
ORDER BY cm.joined_at;

-- Check all groups and their member counts
SELECT 
  c.id,
  c.title,
  c.type,
  c.created_by,
  COUNT(cm.id) as member_count
FROM conversations c
LEFT JOIN conversation_members cm ON cm.conversation_id = c.id
WHERE c.type = 'group'
GROUP BY c.id, c.title, c.type, c.created_by
ORDER BY c.created_at DESC;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('conversations', 'conversation_members');

-- Check current policies
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
WHERE tablename IN ('conversations', 'conversation_members')
ORDER BY tablename, cmd;
