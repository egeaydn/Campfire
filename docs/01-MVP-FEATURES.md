# MVP - Mutlaka Olacak Özellikler

## ✅ Core Features (Öncelik 1)

### 1. Authentication & Authorization
- [x] Email ile kayıt/giriş (Supabase Auth)
- [ ] OAuth entegrasyonu (GitHub/Google)
- [x] Session yönetimi
- [x] Güvenli logout

### 2. Profil Yönetimi
- [x] Profil tablosu (profiles) - trigger ile otomatik oluşturulur
- [ ] Username seçimi (unique constraint)
- [ ] Avatar upload
- [ ] Display name
- [ ] Bio (opsiyonel)
- [ ] Profil tamamlama akışı

### 3. Kullanıcı Keşfi
- [ ] Username ile kullanıcı arama
- [ ] Kullanıcı profili görüntüleme
- [ ] "Message" butonu ile DM başlatma

### 4. Conversation (Sohbet) Yönetimi
- [ ] DM (Direct Message) oluşturma
- [ ] Group conversation oluşturma
- [ ] Conversation listesi (sidebar)
- [ ] Conversation üye yönetimi
- [ ] Conversation silme (sadece creator)

### 5. Mesajlaşma (Core Messaging)
- [ ] Text mesaj gönderme
- [ ] Gerçek zamanlı mesaj alıma (Supabase Realtime)
- [ ] Mesaj düzenleme (sadece gönderen)
- [ ] Mesaj silme (gönderen veya conversation creator)
- [ ] Mesaj timestamping

### 6. Message Reads (Okundu Bilgisi)
- [ ] Message read tracking
- [ ] "Görüldü" badge/indicator
- [ ] Son okunma zamanı

### 7. File & Media Upload
- [ ] Supabase Storage entegrasyonu
- [ ] Image upload & preview
- [ ] File upload (PDF, docs)
- [ ] File download
- [ ] File size limit kontrolü

### 8. Security & Permissions
- [x] Row Level Security (RLS) policies
- [x] Sadece conversation üyeleri mesajları görebilir
- [x] Sadece gönderen mesajını düzenleyebilir
- [ ] Rate limiting (anti-spam)

### 9. UI/UX Components
- [x] Navbar (yapıldı)
- [ ] Sidebar (conversation list)
- [ ] Chat view (message list + composer)
- [ ] Message item component
- [ ] Composer (input + upload)
- [ ] Profile modal
- [ ] New conversation modal
- [x] Theme switcher (dark mode default)

## 📊 MVP Kapsam Dışı (Post-MVP)

Bunlar ilk versiyonda olmayacak:

- Voice messages
- Video calls
- Message reactions/emoji
- Typing indicators
- Message search
- Push notifications
- E2E encryption
- Message threads/replies
- Link previews
- Bots & automation
- Analytics dashboard
