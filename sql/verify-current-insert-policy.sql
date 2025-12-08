-- Check current INSERT policy on conversations
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
AND cmd = 'INSERT';

-- Also check if there are multiple INSERT policies (conflict)
SELECT COUNT(*) as insert_policy_count
FROM pg_policies 
WHERE tablename = 'conversations' 
AND cmd = 'INSERT';
