# API Endpoints & Server Actions

## 📝 Not: Next.js App Router + Supabase

Bu projede geleneksel REST API yerine **Next.js Server Actions** ve **Supabase Client SDK** kullanacağız. RLS policies sayesinde birçok işlem güvenli şekilde client-side yapılabilir.

---

## 🔐 Authentication

### `POST /api/auth/signup`
Yeni kullanıcı kaydı

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "session": { "access_token": "...", "refresh_token": "..." }
}
```

**Implementation:**
```typescript
// app/actions/auth.ts
'use server'
export async function signUp(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  if (error) throw error;
  return data;
}
```

---

### `POST /api/auth/signin`
Kullanıcı girişi

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

---

### `POST /api/auth/signout`
Çıkış yapma

---

## 👤 Profile

### `GET /api/profile/:userId`
Kullanıcı profili getir

**Response:**
```json
{
  "id": "uuid",
  "username": "johndoe",
  "display_name": "John Doe",
  "avatar_url": "https://...",
  "bio": "Hello world",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Implementation:**
```typescript
// Direct Supabase client call (RLS protected)
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

---

### `PATCH /api/profile`
Profil güncelleme

**Request:**
```json
{
  "username": "newusername",
  "display_name": "New Name",
  "bio": "Updated bio"
}
```

**Server Action:**
```typescript
'use server'
export async function updateProfile(updates: ProfileUpdate) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);
    
  if (error) throw error;
}
```

---

### `POST /api/profile/avatar`
Avatar upload

**Implementation:**
```typescript
'use server'
export async function uploadAvatar(file: File) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const fileName = `${user.id}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file);
    
  if (error) throw error;
  
  const { data: publicURL } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);
    
  // Update profile
  await supabase
    .from('profiles')
    .update({ avatar_url: publicURL.publicUrl })
    .eq('id', user.id);
    
  return publicURL.publicUrl;
}
```

---

## 🔍 Search

### `GET /api/users/search?q=username`
Kullanıcı arama

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar_url": "https://..."
    }
  ]
}
```

**Implementation:**
```typescript
export async function searchUsers(query: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${query}%`)
    .limit(10);
    
  return data;
}
```

---

## 💬 Conversations

### `GET /api/conversations`
Kullanıcının tüm conversationlarını getir

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "type": "dm",
      "title": null,
      "created_at": "2024-01-01T00:00:00Z",
      "members": [...],
      "last_message": {...}
    }
  ]
}
```

**Implementation:**
```typescript
export async function getConversations() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data } = await supabase
    .from('conversations')
    .select(`
      *,
      conversation_members!inner(user_id),
      messages(content, created_at, sender_id)
    `)
    .eq('conversation_members.user_id', user.id)
    .order('updated_at', { ascending: false });
    
  return data;
}
```

---

### `POST /api/conversations`
Yeni conversation oluştur

**Request:**
```json
{
  "type": "dm" | "group",
  "title": "Group Name", // Optional, only for groups
  "member_ids": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "type": "dm",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Server Action:**
```typescript
'use server'
export async function createConversation({
  type,
  title,
  memberIds
}: CreateConversationInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // 1. Create conversation
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ type, title, created_by: user.id })
    .select()
    .single();
    
  if (error) throw error;
  
  // 2. Add members
  const members = [user.id, ...memberIds].map(id => ({
    conversation_id: conv.id,
    user_id: id
  }));
  
  await supabase.from('conversation_members').insert(members);
  
  return conv;
}
```

---

### `GET /api/conversations/:id`
Specific conversation detayları

---

### `DELETE /api/conversations/:id`
Conversation silme (sadece creator)

**Server Action:**
```typescript
'use server'
export async function deleteConversation(conversationId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // RLS will check if user is creator
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('created_by', user.id);
    
  if (error) throw error;
}
```

---

## 📨 Messages

### `GET /api/conversations/:id/messages?limit=50&offset=0`
Conversation mesajlarını getir (pagination)

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender_id": "uuid",
      "content": "Hello!",
      "file_url": null,
      "created_at": "2024-01-01T00:00:00Z",
      "edited_at": null,
      "sender": {
        "username": "johndoe",
        "avatar_url": "https://..."
      }
    }
  ],
  "total": 234
}
```

**Implementation:**
```typescript
export async function getMessages(
  conversationId: string,
  limit = 50,
  offset = 0
) {
  const supabase = createClient();
  
  const { data, count } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles(username, avatar_url)
    `, { count: 'exact' })
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
    
  return { messages: data, total: count };
}
```

---

### `POST /api/conversations/:id/messages`
Mesaj gönder

**Request:**
```json
{
  "content": "Hello world!",
  "file_url": "https://..." // Optional
}
```

**Server Action:**
```typescript
'use server'
export async function sendMessage({
  conversationId,
  content,
  fileUrl
}: SendMessageInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      file_url: fileUrl
    })
    .select()
    .single();
    
  if (error) throw error;
  
  // Update conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);
    
  return data;
}
```

---

### `PATCH /api/messages/:id`
Mesaj düzenle

**Request:**
```json
{
  "content": "Updated message"
}
```

**Server Action:**
```typescript
'use server'
export async function editMessage(messageId: string, content: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('messages')
    .update({ content, edited_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('sender_id', user.id); // RLS will enforce this
    
  if (error) throw error;
}
```

---

### `DELETE /api/messages/:id`
Mesaj sil (soft delete)

**Server Action:**
```typescript
'use server'
export async function deleteMessage(messageId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('sender_id', user.id);
    
  if (error) throw error;
}
```

---

## 👁️ Message Reads

### `POST /api/messages/:id/read`
Mesaj okundu işaretle

**Server Action:**
```typescript
'use server'
export async function markMessageAsRead(messageId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('message_reads')
    .insert({
      message_id: messageId,
      user_id: user.id
    });
    
  // Ignore duplicate key errors
  if (error && error.code !== '23505') throw error;
}
```

---

## 📁 File Upload

### `POST /api/upload`
File/image upload

**Server Action:**
```typescript
'use server'
export async function uploadFile(file: File) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const fileName = `${user.id}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('message-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) throw error;
  
  const { data: publicURL } = supabase.storage
    .from('message-files')
    .getPublicUrl(fileName);
    
  return {
    url: publicURL.publicUrl,
    fileName: file.name,
    fileType: file.type
  };
}
```

---

## 🚫 Blocking (Optional)

### `POST /api/users/:id/block`
Kullanıcı engelle

### `DELETE /api/users/:id/block`
Engeli kaldır
