-- ============================================
-- CAMPFIRE: PUSH NOTIFICATIONS SYSTEM
-- ============================================

-- 1. Push subscription tablosu
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Bir kullanıcı aynı endpoint'i birden fazla kez kaydedemez
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
  ON push_subscriptions(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Notification preferences tablosu
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  mention_notifications BOOLEAN DEFAULT true,
  dm_notifications BOOLEAN DEFAULT true,
  group_notifications BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON notification_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Notification log (debugging için)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  success BOOLEAN,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user_id 
  ON notification_log(user_id, sent_at DESC);

-- RLS
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification log"
  ON notification_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Varsayılan notification preferences oluştur (trigger)
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_default_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- 5. Eski subscriptions temizle (30 gün kullanılmamış)
CREATE OR REPLACE FUNCTION cleanup_old_push_subscriptions()
RETURNS void AS $$
BEGIN
  DELETE FROM push_subscriptions
  WHERE last_used_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- 6. Kullanıcının bildirim alıp alamayacağını kontrol et
CREATE OR REPLACE FUNCTION should_send_notification(
  p_user_id UUID,
  p_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_prefs notification_preferences;
  v_current_time TIME;
BEGIN
  -- Preferences getir
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  -- Eğer preferences yoksa varsayılan true
  IF v_prefs IS NULL THEN
    RETURN true;
  END IF;
  
  -- Genel olarak kapalıysa
  IF NOT v_prefs.enabled THEN
    RETURN false;
  END IF;
  
  -- Type bazında kontrol
  IF p_type = 'message' AND NOT v_prefs.message_notifications THEN
    RETURN false;
  END IF;
  
  IF p_type = 'mention' AND NOT v_prefs.mention_notifications THEN
    RETURN false;
  END IF;
  
  IF p_type = 'dm' AND NOT v_prefs.dm_notifications THEN
    RETURN false;
  END IF;
  
  IF p_type = 'group' AND NOT v_prefs.group_notifications THEN
    RETURN false;
  END IF;
  
  -- Quiet hours kontrolü
  IF v_prefs.quiet_hours_start IS NOT NULL AND v_prefs.quiet_hours_end IS NOT NULL THEN
    v_current_time := LOCALTIME;
    
    IF v_prefs.quiet_hours_start < v_prefs.quiet_hours_end THEN
      -- Normal range (örn: 22:00 - 08:00)
      IF v_current_time >= v_prefs.quiet_hours_start 
         AND v_current_time <= v_prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    ELSE
      -- Gece yarısını geçen range (örn: 23:00 - 01:00)
      IF v_current_time >= v_prefs.quiet_hours_start 
         OR v_current_time <= v_prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- KURULUM TAMAMLANDI
-- ============================================
-- Backend'de web-push kütüphanesi kullanarak bildirim gönderimi yapılacak
-- VAPID keys generate etmek için: npx web-push generate-vapid-keys
