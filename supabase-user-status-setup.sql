-- Create user_status table for presence tracking

CREATE TABLE IF NOT EXISTS user_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'away')) DEFAULT 'offline',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_status_user_id ON user_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_status ON user_status(status);
CREATE INDEX IF NOT EXISTS idx_user_status_last_seen ON user_status(last_seen);

-- RLS Policies
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- Anyone can view user status
CREATE POLICY "Anyone can view user status"
ON user_status
FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own status
CREATE POLICY "Users can insert own status"
ON user_status
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own status
CREATE POLICY "Users can update own status"
ON user_status
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_user_status_updated_at ON user_status;
CREATE TRIGGER trigger_update_user_status_updated_at
  BEFORE UPDATE ON user_status
  FOR EACH ROW
  EXECUTE FUNCTION update_user_status_updated_at();

-- Function to clean up stale online statuses (called by cron or periodically)
CREATE OR REPLACE FUNCTION cleanup_stale_status()
RETURNS void AS $$
BEGIN
  UPDATE user_status
  SET status = 'offline'
  WHERE status = 'online'
  AND last_seen < now() - interval '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- Insert initial status for existing users (run once)
INSERT INTO user_status (user_id, status, last_seen)
SELECT id, 'offline', now()
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
