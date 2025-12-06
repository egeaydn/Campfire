-- ============================================
-- CAMPFIRE: END-TO-END ENCRYPTION SYSTEM
-- ============================================
-- Bu dosya E2E encryption için key management şemasını ekler

-- NOT: Gerçek şifreleme client-side yapılır (Web Crypto API)
-- Bu tablo sadece public key'leri saklar

-- 1. User encryption keys tablosu
CREATE TABLE IF NOT EXISTS user_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL, -- Base64 encoded public key
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_encryption_keys_user_id 
  ON user_encryption_keys(user_id);

-- RLS
ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Herkes public key'leri görebilir (encryption için gerekli)
CREATE POLICY "Anyone can view public keys"
  ON user_encryption_keys
  FOR SELECT
  USING (true);

-- Kullanıcılar kendi key'lerini yönetebilir
CREATE POLICY "Users can manage their own keys"
  ON user_encryption_keys
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Conversation encryption keys (grup şifreleme için)
CREATE TABLE IF NOT EXISTS conversation_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL, -- Her kullanıcı için şifrelenmiş conversation key
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_encryption_keys_conversation_id 
  ON conversation_encryption_keys(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_encryption_keys_user_id 
  ON conversation_encryption_keys(user_id);

-- RLS
ALTER TABLE conversation_encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view keys for their conversations"
  ON conversation_encryption_keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = conversation_encryption_keys.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert keys for their conversations"
  ON conversation_encryption_keys
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = conversation_encryption_keys.conversation_id
        AND user_id = auth.uid()
    )
  );

-- 3. Encrypted messages için flag
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_is_encrypted 
  ON messages(is_encrypted) WHERE is_encrypted = true;

-- 4. Key rotation log (güvenlik için)
CREATE TABLE IF NOT EXISTS key_rotation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_key_fingerprint TEXT,
  new_key_fingerprint TEXT,
  rotated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_key_rotation_log_user_id 
  ON key_rotation_log(user_id, rotated_at DESC);

-- RLS
ALTER TABLE key_rotation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own key rotation log"
  ON key_rotation_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Device management (multi-device E2E için)
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  public_key TEXT NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verified BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id 
  ON user_devices(user_id);

-- RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own devices"
  ON user_devices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- E2E ENCRYPTION WORKFLOW
-- ============================================
-- 1. Her kullanıcı key pair oluşturur (client-side)
--    - Web Crypto API: crypto.subtle.generateKey()
--    - Public key DB'ye kaydedilir
--    - Private key IndexedDB'de saklanır (ASLA sunucuya gönderilmez!)

-- 2. DM için:
--    - Gönderen: Mesajı alıcının public key'i ile şifreler
--    - Alıcı: Kendi private key'i ile şifre çözer

-- 3. Grup için:
--    - Conversation için symmetric key oluştur
--    - Bu key'i her üyenin public key'i ile şifrele
--    - conversation_encryption_keys tablosuna kaydet
--    - Mesajları conversation key ile şifrele

-- 4. Yeni üye ekleme:
--    - Conversation key'i yeni üyenin public key'i ile şifrele
--    - Yeni kayıt ekle

-- 5. Üye çıkarma:
--    - Conversation key'i rotate et
--    - Tüm kalan üyeler için yeni key'i şifrele

-- ============================================
-- GÜVENLİK NOTLARI
-- ============================================
-- ⚠️ Private key'ler ASLA sunucuya gönderilmemelidir!
-- ⚠️ İndexedDB kullanarak browser'da saklanmalıdır
-- ⚠️ Key rotation düzenli yapılmalıdır
-- ⚠️ Device verification eklenmeli (QR code, etc.)
-- ⚠️ Backup/recovery mekanizması gereklidir
-- ⚠️ Forward secrecy için session keys kullanılabilir

-- ============================================
-- KURULUM TAMAMLANDI
-- ============================================
