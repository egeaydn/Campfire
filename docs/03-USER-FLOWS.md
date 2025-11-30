# User Flows & Journey Maps

## 🚀 1. Kayıt / Giriş Akışı

### Sign Up Flow
```
Landing Page
    ↓
[Sign Up Button]
    ↓
Sign Up Form (Email + Password)
    ↓
Email Verification (Supabase)
    ↓
Profile Completion Screen
    ├── Username seçimi (unique check)
    ├── Display name
    ├── Avatar upload (optional)
    └── Bio (optional)
    ↓
Dashboard / Conversation List
```

### Sign In Flow
```
Landing Page
    ↓
[Sign In Button]
    ↓
Login Form (Email + Password)
    ↓
Dashboard / Conversation List
```

### OAuth Flow (GitHub/Google)
```
Landing Page
    ↓
[Continue with GitHub/Google]
    ↓
OAuth Provider Authentication
    ↓
Callback URL → Supabase Auth
    ↓
Profile Check
    ├── Profile exists? → Dashboard
    └── Profile incomplete? → Profile Completion
```

---

## 💬 2. DM (Direct Message) Başlatma

### Yeni DM Akışı
```
Dashboard
    ↓
[Search Bar] → Username girilir
    ↓
User Search Results
    ↓
[User Card] → Profil görünür
    ↓
[Message Button] tıklanır
    ↓
Backend Check:
    ├── DM conversation zaten var mı?
    │   ├── Var → Mevcut conversation'a yönlendir
    │   └── Yok → Yeni conversation oluştur
    │       ├── INSERT INTO conversations (type='dm')
    │       ├── INSERT conversation_members (2 kişi)
    │       └── Yönlendir /chat/[conversationId]
    ↓
Chat View açılır
```

**Code Logic:**
```typescript
async function createOrGetDM(otherUserId: string) {
  // 1. Check if DM exists
  const existingDM = await supabase
    .from('conversations')
    .select('id')
    .eq('type', 'dm')
    .in('id', (
      supabase.from('conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUserId)
    ))
    .in('id', (
      supabase.from('conversation_members')
        .select('conversation_id')
        .eq('user_id', otherUserId)
    ))
    .single();

  if (existingDM) return existingDM.id;

  // 2. Create new DM
  const { data: conv } = await supabase
    .from('conversations')
    .insert({ type: 'dm' })
    .select()
    .single();

  // 3. Add members
  await supabase.from('conversation_members').insert([
    { conversation_id: conv.id, user_id: currentUserId },
    { conversation_id: conv.id, user_id: otherUserId }
  ]);

  return conv.id;
}
```

---

## 👥 3. Grup Sohbet Oluşturma

### Yeni Grup Akışı
```
Dashboard
    ↓
[New Group Button]
    ↓
New Group Modal açılır
    ├── Group Title input
    ├── Select Members (multi-select)
    └── [Create Button]
    ↓
Backend:
    ├── INSERT INTO conversations (type='group', title)
    ├── INSERT conversation_members (creator + selected users)
    └── Yönlendir /chat/[conversationId]
    ↓
Group Chat View açılır
```

---

## 📨 4. Mesajlaşma Akışı

### Mesaj Gönderme
```
Chat View
    ↓
User writes message in Composer
    ↓
[Send Button] or [Enter] pressed
    ↓
Client:
    ├── Optimistic UI update (message hemen gösterilir)
    └── INSERT INTO messages (conversation_id, sender_id, content)
    ↓
Supabase Realtime:
    └── Tüm conversation üyeleri eventi alır
    └── UI'da mesaj render edilir
```

### Mesaj Alma (Realtime)
```
Chat View Mounted
    ↓
useEffect: Realtime subscription başlar
    ↓
supabase
  .from('messages:conversation_id=eq.{id}')
  .on('INSERT', (payload) => {
    setMessages(prev => [...prev, payload.new]);
  })
  .subscribe();
    ↓
Yeni mesaj gelince otomatik UI update
```

### Mesaj Düzenleme
```
Message Item
    ↓
[Edit Button] (sadece gönderen görür)
    ↓
Inline edit mode açılır
    ↓
User edits content
    ↓
[Save] → UPDATE messages SET content=..., edited_at=NOW()
    ↓
UI'da mesaj güncellenir
```

### Mesaj Silme
```
Message Item
    ↓
[Delete Button] (sender veya conversation creator)
    ↓
Confirmation modal
    ↓
[Confirm] → UPDATE messages SET deleted_at=NOW() (soft delete)
    ↓
UI'dan mesaj kaldırılır
```

---

## 👁️ 5. Mesaj Okundu İşlemi

### Read Receipt Flow
```
User opens Chat View
    ↓
Messages loaded
    ↓
useEffect: Her mesaj için read check
    ↓
Okunmamış mesajlar için:
    ├── INSERT INTO message_reads (message_id, user_id, read_at)
    └── (RLS: user sadece kendi kaydını ekleyebilir)
    ↓
Realtime:
    └── message_reads eventi → sender UI'da "Seen" badge gösterir
```

**Code Logic:**
```typescript
useEffect(() => {
  messages.forEach(async (msg) => {
    if (msg.sender_id !== currentUserId) {
      // Check if already read
      const { data: read } = await supabase
        .from('message_reads')
        .select('id')
        .eq('message_id', msg.id)
        .eq('user_id', currentUserId)
        .single();

      if (!read) {
        await supabase.from('message_reads').insert({
          message_id: msg.id,
          user_id: currentUserId
        });
      }
    }
  });
}, [messages]);
```

---

## 🟢 6. Presence & Last Seen (Optional)

### Online Status Update
```
App Mount
    ↓
Heartbeat başlar (setInterval 30s)
    ↓
UPDATE user_status SET status='online', last_seen=NOW()
    ↓
App Unmount / Tab Close:
    └── UPDATE user_status SET status='offline'
```

### Presence Subscription
```
Sidebar Component
    ↓
Subscribe to user_status changes
    ↓
Display online badge for online users
```

---

## 📁 7. File Upload Akışı

### Image/File Upload
```
Composer
    ↓
[Upload Button] clicked
    ↓
File picker açılır
    ↓
User selects file
    ↓
Client:
    ├── File validation (size, type)
    └── Upload to Supabase Storage
        ├── Signed URL al (server action)
        ├── File upload
        └── Public URL al
    ↓
INSERT INTO messages (file_url, file_name, file_type)
    ↓
Message UI'da file preview ile gösterilir
```

**Code Logic:**
```typescript
async function uploadFile(file: File) {
  const fileName = `${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('message-files')
    .upload(fileName, file);

  if (error) throw error;

  const { data: publicURL } = supabase.storage
    .from('message-files')
    .getPublicUrl(fileName);

  return publicURL.publicUrl;
}
```

---

## 🔍 8. Kullanıcı Arama Akışı

### Search Flow
```
Dashboard → Search Bar
    ↓
User types username
    ↓
Debounced search (300ms)
    ↓
Backend:
    SELECT * FROM profiles
    WHERE username ILIKE '%{query}%'
    LIMIT 10
    ↓
Search Results displayed
    ↓
[User Card] → Profile view → [Message Button]
```

---

## 🚫 9. User Blocking (Optional)

### Block User Flow
```
User Profile View
    ↓
[Block Button]
    ↓
Confirmation modal
    ↓
[Confirm] → INSERT INTO blocked_users (blocker_id, blocked_id)
    ↓
Backend:
    └── RLS policies prevent blocked user from messaging
    ↓
UI: Blocked user görünmez / mesaj gönderemez
```
