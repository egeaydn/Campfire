-- Disable RLS temporarily to debug
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE banned_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Enable RLS on banned_users table if not already enabled
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view bans" ON banned_users;
DROP POLICY IF EXISTS "Admin can insert bans" ON banned_users;
DROP POLICY IF EXISTS "Admin can delete bans" ON banned_users;

-- Allow admins to view all bans
CREATE POLICY "Admin can view bans" ON banned_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Allow admins to insert bans
CREATE POLICY "Admin can insert bans" ON banned_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Allow admins to delete bans (for unban)
CREATE POLICY "Admin can delete bans" ON banned_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Enable RLS on admin_users table if not already enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view admin status" ON admin_users;
DROP POLICY IF EXISTS "Admin can manage admins" ON admin_users;

-- Allow anyone to check if someone is an admin (for UI visibility)
CREATE POLICY "Anyone can view admin status" ON admin_users
  FOR SELECT
  USING (true);

-- Only admins can modify admin_users
CREATE POLICY "Admin can manage admins" ON admin_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );
