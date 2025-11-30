# Database Schema & Data Model

## 📋 Core Tables

### 1. `profiles`
Kullanıcı profil bilgileri (auth.users ile 1:1 ilişki)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auth.users'a yeni kullanıcı eklenince profil oluştur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**RLS Policies:**
- ✅ Herkes tüm profilleri okuyabilir (public read)
- ✅ Kullanıcı sadece kendi profilini güncelleyebilir

---

### 2. `conversations`
DM ve grup sohbetleri

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('dm', 'group')),
  title TEXT, -- Sadece grup sohbetlerde kullanılır
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**İndeksler:**
```sql
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_created_by ON conversations(created_by);
```

**RLS Policies:**
- ✅ Kullanıcı sadece üye olduğu conversationları görebilir
- ✅ Herkes conversation oluşturabilir

---

### 3. `conversation_members`
Conversation üyelik tablosu (many-to-many)

```sql
CREATE TABLE conversation_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  UNIQUE(conversation_id, user_id)
);
```

**İndeksler:**
```sql
CREATE INDEX idx_members_conversation ON conversation_members(conversation_id);
CREATE INDEX idx_members_user ON conversation_members(user_id);
```

**RLS Policies:**
- ✅ Kullanıcı sadece kendi üyeliklerini görebilir
- ✅ Conversation creator üye ekleyebilir/çıkarabilir

---

### 4. `messages`
Tüm mesajlar (text + file)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);
```

**İndeksler:**
```sql
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
```

**RLS Policies:**
- ✅ Sadece conversation üyeleri mesajları görebilir
- ✅ Herkes mesaj gönderebilir
- ✅ Sadece gönderen kendi mesajını düzenleyebilir/silebilir

---

### 5. `message_reads`
Mesaj okundu takibi

```sql
CREATE TABLE message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);
```

**İndeksler:**
```sql
CREATE INDEX idx_reads_message ON message_reads(message_id);
CREATE INDEX idx_reads_user ON message_reads(user_id);
```

**RLS Policies:**
- ✅ Kullanıcı kendi read kayıtlarını görebilir
- ✅ Kullanıcı kendi read kaydını ekleyebilir

---

## 📊 Optional Tables (Post-MVP)

### `user_status`
Online/offline durumu ve last seen

```sql
CREATE TABLE user_status (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `notifications`
Bildirimler (okunmamış mesajlar, mentions)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `blocked_users`
Engellenen kullanıcılar

```sql
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);
```

### `friend_requests`
Arkadaşlık istekleri (opsiyonel özellik)

```sql
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);
```

---

## 🔍 Useful Queries

### Kullanıcının tüm conversationlarını getir
```sql
SELECT c.*, cm.joined_at
FROM conversations c
JOIN conversation_members cm ON c.id = cm.conversation_id
WHERE cm.user_id = :user_id
ORDER BY c.updated_at DESC;
```

### Conversation'daki son mesajı getir
```sql
SELECT m.*
FROM messages m
WHERE m.conversation_id = :conversation_id
  AND m.deleted_at IS NULL
ORDER BY m.created_at DESC
LIMIT 1;
```

### Okunmamış mesaj sayısı
```sql
SELECT COUNT(*)
FROM messages m
WHERE m.conversation_id = :conversation_id
  AND m.sender_id != :user_id
  AND NOT EXISTS (
    SELECT 1 FROM message_reads mr
    WHERE mr.message_id = m.id AND mr.user_id = :user_id
  );
```
