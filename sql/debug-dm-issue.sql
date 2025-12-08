-- CRITICAL DEBUG: Check why B user doesn't see the conversation

-- 1. Check ALL conversation members for this conversation
SELECT * FROM conversation_members 
WHERE conversation_id = '4c389952-d3bb-4f9c-9068-f1ffee2b4ffb';

-- 2. Count how many members
SELECT COUNT(*) as member_count 
FROM conversation_members 
WHERE conversation_id = '4c389952-d3bb-4f9c-9068-f1ffee2b4ffb';

-- 3. Check all recent conversation_members (last 10)
SELECT 
  cm.*,
  p.username
FROM conversation_members cm
LEFT JOIN profiles p ON p.id = cm.user_id
ORDER BY cm.joined_at DESC
LIMIT 10;

-- 2. Check RLS policies on conversation_members
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'conversation_members'
ORDER BY cmd;

-- 3. Test: Can we see this conversation as User B?
-- Get User B's ID first
SELECT id, username, email FROM profiles WHERE username LIKE '%b%' OR email LIKE '%b%';

-- Then check if User B can see their memberships
-- (Run this with User B's ID)
-- SELECT * FROM conversation_members WHERE user_id = 'USER_B_ID_HERE';
