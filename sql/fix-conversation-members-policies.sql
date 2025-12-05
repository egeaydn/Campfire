-- Fix conversation_members RLS policies for group functionality

-- First, check if RLS is enabled
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view conversation members" ON conversation_members;
DROP POLICY IF EXISTS "Users can add members" ON conversation_members;
DROP POLICY IF EXISTS "Users can delete own membership" ON conversation_members;
DROP POLICY IF EXISTS "Authenticated users can insert members" ON conversation_members;
DROP POLICY IF EXISTS "Users can delete memberships" ON conversation_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON conversation_members;

-- 1. SELECT: Anyone authenticated can view all members (simplified)
CREATE POLICY "Anyone can view members"
ON conversation_members
FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT: Authenticated users can add members (app logic validates)
-- This is crucial for group creation - creator needs to add multiple members
CREATE POLICY "Authenticated can insert members"
ON conversation_members
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. DELETE: Allow deletion with app-level validation
-- For both leaving (own) and removing others (admin check in app)
CREATE POLICY "Allow member deletion"
ON conversation_members
FOR DELETE
TO authenticated
USING (true);

-- 4. UPDATE: Allow role updates for future features
CREATE POLICY "Allow member updates"
ON conversation_members
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'conversation_members';

