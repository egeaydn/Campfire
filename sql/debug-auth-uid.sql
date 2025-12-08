-- Check current authenticated user
SELECT auth.uid() as current_user_id;

-- Check if RLS is blocking the insert
-- Try to manually insert a test conversation (will fail if RLS blocks it)
-- Replace 'YOUR-USER-ID' with your actual user ID
-- INSERT INTO conversations (type, created_by) 
-- VALUES ('dm', auth.uid())
-- RETURNING *;
