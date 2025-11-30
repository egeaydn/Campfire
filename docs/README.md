# Campfire Documentation Index

## 📚 Dokümantasyon Rehberi

Projenin tüm teknik ve planlama dokümantasyonu bu klasörde bulunmaktadır.

---

## 📖 Dökümanlar

### [00-PROJECT-OVERVIEW.md](./00-PROJECT-OVERVIEW.md)
**Proje Genel Bakış**
- Proje amacı & değer önermesi
- Teknoloji yığını
- Renk paleti
- Başarı metrikleri

### [01-MVP-FEATURES.md](./01-MVP-FEATURES.md)
**MVP Özellikleri**
- Core features (mutlaka olacaklar)
- Detaylı feature listesi
- Checkbox'larla ilerleme takibi
- MVP kapsam dışı özellikler

### [02-DATABASE-SCHEMA.md](./02-DATABASE-SCHEMA.md)
**Database Schema & Data Model**
- Tüm tablolar (profiles, conversations, messages, vb.)
- İlişkiler & constraint'ler
- RLS policies
- İndeksler
- Useful queries

### [03-USER-FLOWS.md](./03-USER-FLOWS.md)
**Kullanıcı Akışları**
- Kayıt/Giriş akışı
- DM başlatma
- Grup oluşturma
- Mesajlaşma akışı
- File upload akışı
- Read receipts flow

### [04-API-ENDPOINTS.md](./04-API-ENDPOINTS.md)
**API & Server Actions**
- Tüm endpoint'ler
- Server actions
- Request/response örnekleri
- Implementation snippets

### [05-REALTIME-ARCHITECTURE.md](./05-REALTIME-ARCHITECTURE.md)
**Realtime Mimari**
- Supabase Realtime kullanımı
- Message subscriptions
- Presence tracking
- Typing indicators
- Optimistic UI updates
- Connection management

### [06-UI-COMPONENTS.md](./06-UI-COMPONENTS.md)
**UI Componentleri**
- Component hierarchy
- Core components (Sidebar, ChatView, Composer, vb.)
- Styling guidelines
- Accessibility
- Responsive design

### [07-ROADMAP.md](./07-ROADMAP.md) ⭐ **EN ÖNEMLİ**
**Development Roadmap**
- 10 fazlı plan
- Her fazda yapılacaklar
- Checkbox'larla ilerleme takibi
- Sprint planning
- Daily checklist template
- **Current Focus: Hemen yapılacaklar**

### [08-QUICK-REFERENCE.md](./08-QUICK-REFERENCE.md) 🚀 **HIZLI ERİŞİM**
**Hızlı Başvuru**
- Code snippets
- Utility functions
- Common patterns
- Troubleshooting
- Environment variables
- Commands

---

## 🎯 Hızlı Başlangıç

### Yeni geliştiriciler için:
1. **İlk okuma**: `00-PROJECT-OVERVIEW.md` - Projeyi tanıyın
2. **MVP özellikleri**: `01-MVP-FEATURES.md` - Ne yapacağımızı anlayın
3. **Database**: `02-DATABASE-SCHEMA.md` - Veri modelini öğrenin
4. **Roadmap**: `07-ROADMAP.md` - Ne yapmamız gerektiğini görün
5. **Quick Reference**: `08-QUICK-REFERENCE.md` - Kodlamaya başlayın

### Geliştirme sırasında:
- **API ihtiyacı**: `04-API-ENDPOINTS.md`
- **Component ihtiyacı**: `06-UI-COMPONENTS.md`
- **Realtime feature**: `05-REALTIME-ARCHITECTURE.md`
- **User flow sorusu**: `03-USER-FLOWS.md`

---

## ✅ Şu An Yapılacaklar (Current Sprint)

### Phase 1: Foundation (DEVAM EDİYOR)

#### 1. Profile Completion ✨ ŞİMDİ!
- [ ] `/profile/complete` sayfası oluştur
- [ ] Username input (unique validation)
- [ ] Display name input
- [ ] Avatar upload component
- [ ] Server action: `updateProfile`
- [ ] Redirect logic

#### 2. User Search
- [ ] SearchBar component
- [ ] Username arama backend
- [ ] Search results UI
- [ ] UserCard component

#### 3. DM Creation
- [ ] "Message" button
- [ ] `createOrGetDM` server action
- [ ] Conversation creation logic
- [ ] Redirect to `/chat/[id]`

**Bu 3 özellik tamamlanınca temel flow çalışır! 🎉**

---

## 📊 İlerleme Takibi

### Tamamlanan ✅
- Database schema
- RLS policies
- Auth flow
- Navbar component
- Supabase setup

### Devam Ediyor 🔄
- Profile completion
- Landing page

### Sırada 📋
- User search
- DM creation
- Chat view
- Messaging

---

## 🔗 Harici Kaynaklar

### Official Docs
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com)

### Tutorials
- [Supabase Realtime Tutorial](https://supabase.com/docs/guides/realtime)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)

---

## 💡 Notlar

- Her doküman güncel tutulmalı
- Yeni özellik eklenince ilgili dokümanlara ekleyin
- Checkbox'ları tamamladıkça işaretleyin
- Roadmap'teki "Current Focus" bölümünü güncel tutun

---

## 🤝 Katkıda Bulunma

Dokümanlara katkıda bulunurken:
1. İlgili dosyayı güncelleyin
2. Changelog oluşturun
3. Tarih ve yapılan değişikliği belirtin

---

**Son Güncelleme**: 28 Kasım 2025

**Proje Durumu**: Phase 1 - Foundation (Devam Ediyor)

**Öncelik**: Profile Completion → User Search → DM Creation
