-- Add is_group column to conversations table
-- This provides a quick boolean check for group conversations

-- Add is_group as a regular boolean column (not generated)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_group BOOLEAN;

-- Add avatar_url column for group conversations (if not exists)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update existing conversations to set is_group based on type
UPDATE conversations 
SET is_group = (type = 'group')
WHERE is_group IS NULL;

-- Add a NOT NULL constraint after populating existing data
ALTER TABLE conversations 
ALTER COLUMN is_group SET DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_is_group ON conversations(is_group);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);

-- Create a trigger to auto-set is_group when type changes
CREATE OR REPLACE FUNCTION update_conversation_is_group()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_group = (NEW.type = 'group');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation_is_group ON conversations;
CREATE TRIGGER trg_update_conversation_is_group
  BEFORE INSERT OR UPDATE OF type ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_is_group();

-- Verify the changes
SELECT 
  id,
  type,
  is_group,
  title,
  avatar_url,
  created_at
FROM conversations
ORDER BY created_at DESC
LIMIT 10;
