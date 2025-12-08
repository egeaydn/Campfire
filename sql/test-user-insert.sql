-- Test: Check if user exists
SELECT id, email, raw_user_meta_data->>'username' as username
FROM auth.users
WHERE id = 'bba97000-9311-4189-a377-47a68f20847f';

-- Test: Try to insert directly with this user ID
-- This will fail in SQL Editor because auth.uid() is null
-- But it shows us what the policy is checking

-- Check the exact policy condition
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'conversations' 
AND cmd = 'INSERT';

-- The issue: Server-side requests might not have auth context
-- Solution: We need to modify the policy OR use service role key for server actions
