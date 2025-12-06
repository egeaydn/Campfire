-- ============================================
-- CAMPFIRE: END-TO-END ENCRYPTION SYSTEM
-- ============================================
-- Bu dosya uçtan uca şifreleme özelliğini ekler
-- NOT: Bu ileri düzey bir özelliktir ve dikkatli implementasyon gerektirir

-- 1. USER_KEYS tablosu (kullanıcı anahtar çiftleri)
CREATE TABLE IF NOT EXISTS user_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL, -- RSA public key (PEM format)
  encrypted_private_key TEXT NOT NULL, -- User password ile şifrelenmiş private key
  key_version INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;

-- Herkes public key'leri okuyabilir (şifreleme için)
CREATE POLICY "Anyone can read public keys"
  ON user_keys
  FOR SELECT
  USING (true);

-- Kullanıcılar kendi key'lerini yönetebilir
CREATE POLICY "Users can manage their own keys"
  ON user_keys
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. ENCRYPTED_MESSAGES tablosu
CREATE TABLE IF NOT EXISTS encrypted_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL, -- AES ile şifrelenmiş içerik
  encrypted_keys JSONB NOT NULL, -- Her üye için şifrelenmiş AES key
  -- Format: { "user_id_1": "encrypted_aes_key", "user_id_2": "..." }
  algorithm TEXT DEFAULT 'AES-GCM', -- Kullanılan şifreleme algoritması
  iv TEXT NOT NULL, -- Initialization Vector
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- İndeks
CREATE INDEX IF NOT EXISTS idx_encrypted_messages_message_id 
  ON encrypted_messages(message_id);

-- RLS
ALTER TABLE encrypted_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read encrypted messages in their conversations"
  ON encrypted_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
      WHERE m.id = encrypted_messages.message_id
        AND cm.user_id = auth.uid()
    )
  );

-- 3. CONVERSATION_ENCRYPTION tablosu (conversation şifreleme durumu)
CREATE TABLE IF NOT EXISTS conversation_encryption (
  conversation_id UUID PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMP WITH TIME ZONE,
  enabled_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE conversation_encryption ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read conversation encryption status"
  ON conversation_encryption
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = conversation_encryption.conversation_id
        AND user_id = auth.uid()
    )
  );

-- 4. KEY_ROTATION_LOG (key rotation geçmişi)
CREATE TABLE IF NOT EXISTS key_rotation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_key_version INT NOT NULL,
  new_key_version INT NOT NULL,
  rotated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_key_rotation_log_user_id 
  ON key_rotation_log(user_id);

-- RLS
ALTER TABLE key_rotation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own key rotation log"
  ON key_rotation_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- E2E ŞİFRELEME NASIL ÇALIŞIR?
-- ============================================

-- 1. KEY GENERATION (Client-side)
-- - Kullanıcı ilk login/signup olduğunda:
-- - RSA key pair oluştur (2048-bit veya 4096-bit)
-- - Private key'i kullanıcının password'ü ile şifrele
-- - Public key'i plaintext olarak kaydet
-- - SubtleCrypto API kullan

-- 2. MESSAGE ENCRYPTION (Gönderen tarafında)
-- - Random AES key (256-bit) oluştur
-- - Mesajı AES key ile şifrele
-- - Her conversation üyesinin public key'ini al
-- - AES key'i her üyenin public key'i ile şifrele
-- - encrypted_content + encrypted_keys'i kaydet

-- 3. MESSAGE DECRYPTION (Alıcı tarafında)
-- - Kendi private key'i password ile çöz
-- - encrypted_keys'den kendi user_id'sine ait key'i al
-- - Encrypted AES key'i private key ile çöz
-- - Mesajı AES key ile çöz

-- 4. GROUP CHAT
-- - Her yeni üye eklendiğinde:
-- - Yeni üyenin public key'ini al
-- - Tüm eski mesajları yeni üye için yeniden şifrele (opsiyonel)
-- - Veya sadece yeni mesajları şifrele

-- ============================================
-- CLIENT-SIDE ÖRNEK (TypeScript/SubtleCrypto)
-- ============================================

-- // 1. Key generation
-- async function generateKeyPair() {
--   const keyPair = await crypto.subtle.generateKey(
--     {
--       name: "RSA-OAEP",
--       modulusLength: 2048,
--       publicExponent: new Uint8Array([1, 0, 1]),
--       hash: "SHA-256",
--     },
--     true,
--     ["encrypt", "decrypt"]
--   );
--   return keyPair;
-- }

-- // 2. Encrypt message
-- async function encryptMessage(content: string, publicKeys: CryptoKey[]) {
--   // Generate AES key
--   const aesKey = await crypto.subtle.generateKey(
--     { name: "AES-GCM", length: 256 },
--     true,
--     ["encrypt", "decrypt"]
--   );
--
--   // Encrypt content
--   const iv = crypto.getRandomValues(new Uint8Array(12));
--   const encryptedContent = await crypto.subtle.encrypt(
--     { name: "AES-GCM", iv },
--     aesKey,
--     new TextEncoder().encode(content)
--   );
--
--   // Encrypt AES key for each recipient
--   const encryptedKeys = {};
--   for (const publicKey of publicKeys) {
--     const encryptedKey = await crypto.subtle.encrypt(
--       { name: "RSA-OAEP" },
--       publicKey,
--       await crypto.subtle.exportKey("raw", aesKey)
--     );
--     encryptedKeys[userId] = arrayBufferToBase64(encryptedKey);
--   }
--
--   return { encryptedContent, encryptedKeys, iv };
-- }

-- // 3. Decrypt message
-- async function decryptMessage(
--   encryptedContent: ArrayBuffer,
--   encryptedKey: string,
--   privateKey: CryptoKey,
--   iv: Uint8Array
-- ) {
--   // Decrypt AES key
--   const aesKeyBuffer = await crypto.subtle.decrypt(
--     { name: "RSA-OAEP" },
--     privateKey,
--     base64ToArrayBuffer(encryptedKey)
--   );
--
--   const aesKey = await crypto.subtle.importKey(
--     "raw",
--     aesKeyBuffer,
--     { name: "AES-GCM" },
--     false,
--     ["decrypt"]
--   );
--
--   // Decrypt content
--   const decryptedContent = await crypto.subtle.decrypt(
--     { name: "AES-GCM", iv },
--     aesKey,
--     encryptedContent
--   );
--
--   return new TextDecoder().decode(decryptedContent);
-- }

-- ============================================
-- GÜVENLİK ÖNEMLİ NOTLAR
-- ============================================
-- 1. Private key ASLA sunucuya plaintext olarak gönderilmemeli
-- 2. Password ile şifreleme güçlü olmalı (PBKDF2 veya Argon2)
-- 3. Key rotation mekanizması implement edilmeli
-- 4. Perfect Forward Secrecy için session keys kullanılmalı
-- 5. Metadata (gönderen, zaman, conversation) hala görünür
-- 6. File encryption ayrı implement edilmeli
-- 7. Browser'ın SubtleCrypto API'si trusted execution environment değil
-- 8. Gerçek E2E için native app veya WebAssembly gerekebilir

-- ============================================
-- KISITLAMALAR
-- ============================================
-- - Search çalışmaz (içerik şifreli)
-- - Link previews çalışmaz
-- - Server-side moderation zorlaşır
-- - Backup ve recovery karmaşık
-- - Key management UX zorluğu
-- - Device sync problemi

-- Bu yüzden E2E encryption opsiyonel olmalı
-- Kullanıcı conversation bazında enable/disable edebilmeli
