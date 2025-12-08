-- Check RLS status on conversation_members table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'conversation_members';

-- Check INSERT policy on conversation_members
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'conversation_members' 
AND cmd = 'INSERT';
