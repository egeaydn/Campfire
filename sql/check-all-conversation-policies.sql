-- Check ALL policies on conversations table
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'conversations'
ORDER BY cmd, policyname;
