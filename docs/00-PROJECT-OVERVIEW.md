# Campfire - Proje Genel Bakış

## 🔥 Proje Amacı & Değer Önermesi

**Campfire**: Koyu mor + siyah temalı, minimal ve hızlı gerçek zamanlı mesajlaşma uygulaması.

**Hedef**: Kullanıcıların hızlıca DM/Grup sohbet başlatıp, sesli/sessiz ama anlık iletişim kurabilecekleri güvenli bir deneyim.

**Marka Hissi**: "Gece kamp ateşi etrafında toplanmak" — sıcak ama modern.

## 🎨 Renk Paleti

```css
--campfire-purple: #3A0CA3  /* Primary */
--campfire-mid: #5D2FE2     /* Mid-tone */
--bg: #0C0B10                /* Background */
--accent-fire: #FF7A3D       /* Accent */
```

## 📊 Teknoloji Yığını

### Frontend
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + Shadcn UI
- **State Management**: React Hooks + Context (gerekirse Zustand)

### Backend / Database / Realtime
- **BaaS**: Supabase
  - Auth (Email, OAuth: GitHub/Google)
  - Realtime (WebSocket subscriptions)
  - PostgreSQL Database
  - Storage (Image/File uploads)
  - Edge Functions (opsiyonel)

### Deployment
- **Frontend**: Vercel
- **Backend**: Supabase Hosted

### Dev Tooling
- ESLint + Prettier
- GitHub Actions (CI)
- Jest / React Testing Library
- Playwright (E2E tests)
- MSW (API mocking)

## 🎯 Hedef Kullanıcı

- Hızlı ve minimal mesajlaşma arayanlar
- Privacy-conscious kullanıcılar
- Grup sohbetlerine ihtiyaç duyan topluluklar
- Modern UI/UX seven kullanıcılar

## 📈 Başarı Metrikleri (KPIs)

- Aktif kullanıcı sayısı (DAU/MAU)
- Mesaj gönderme/alma hızı (< 500ms)
- Kullanıcı retention oranı
- Ortalama sohbet süresi
- Sistem uptime (>99.5%)
