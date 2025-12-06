# Development Roadmap - Prioriteli Adımlar

## 🎯 Phase 1: Foundation (Hafta 1-2)

### ✅ Tamamlananlar
- [x] Next.js projesi kurulumu
- [x] Supabase entegrasyonu
- [x] Database schema oluşturuldu
- [x] RLS policies tanımlandı
- [x] Auth flow (sign up/sign in)
- [x] Navbar komponenti

### 🔄 Devam Edenler
- [ ] **Profile Completion Flow**
  - [ ] `/profile/complete` sayfası
  - [ ] Username input (unique validation)
  - [ ] Display name input
  - [ ] Avatar upload component
  - [ ] Profile update action
  - [ ] Redirect to dashboard after completion

- [ ] **Landing Page Cleanup**
  - [ ] Hero section
  - [ ] Feature highlights
  - [ ] CTA buttons

---

## 🚀 Phase 2: Core Messaging (Hafta 3-4)

### Priority 1: User Search & DM Creation
- [ ] **Search Bar Component**
  - [ ] Username search functionality
  - [ ] Debounced search (300ms)
  - [ ] Search results dropdown
  - [ ] User card component

- [ ] **DM Creation**
  - [ ] "Message" button on user card
  - [ ] Check existing DM logic
  - [ ] Create new conversation server action
  - [ ] Add conversation members
  - [ ] Redirect to chat view

### Priority 2: Conversation List
- [ ] **Sidebar Component**
  - [ ] Conversation list UI
  - [ ] Conversation item component
  - [ ] Last message preview
  - [ ] Unread count badge
  - [ ] Timestamp formatting

- [ ] **Realtime Updates**
  - [ ] Subscribe to conversation_members changes
  - [ ] Subscribe to new messages
  - [ ] Update conversation order on new message

### Priority 3: Chat View
- [ ] **Message Display**
  - [ ] Chat view layout
  - [ ] Message list component
  - [ ] Message item component
  - [ ] Avatar + username
  - [ ] Timestamp formatting
  - [ ] Own message vs others styling

- [ ] **Send Message**
  - [ ] Composer component
  - [ ] Text input
  - [ ] Send button
  - [ ] Enter key handler
  - [ ] Send message action
  - [ ] Optimistic UI update

- [ ] **Realtime Messaging**
  - [ ] Subscribe to messages for conversation
  - [ ] Handle INSERT events
  - [ ] Auto-scroll to bottom
  - [ ] New message notification

---

## 📝 Phase 3: Message Features (Hafta 5)

### Priority 1: Message Actions
- [ ] **Edit Message**
  - [ ] Edit button (only for sender)
  - [ ] Inline edit mode
  - [ ] Update message action
  - [ ] Show "edited" indicator

- [ ] **Delete Message**
  - [ ] Delete button (sender + creator)
  - [ ] Confirmation modal
  - [ ] Soft delete action
  - [ ] Remove from UI

### Priority 2: Read Receipts
- [ ] **Mark as Read**
  - [ ] Auto-mark when message visible
  - [ ] Insert message_reads record
  - [ ] Handle duplicate prevention

- [ ] **Display Read Status**
  - [ ] "Seen" badge on own messages
  - [ ] Show who read (in groups)
  - [ ] Last read timestamp

---

## 📁 Phase 4: File Upload (Hafta 6)

### Priority 1: Image Upload
- [ ] **Supabase Storage Setup**
  - [ ] Create `message-files` bucket
  - [ ] Set storage policies
  - [ ] Configure public access

- [ ] **Upload Component**
  - [ ] File picker button
  - [ ] File validation (size, type)
  - [ ] Upload progress indicator
  - [ ] Upload to storage action
  - [ ] Get public URL

- [ ] **Image Preview**
  - [ ] Display image in message
  - [ ] Lightbox for full view
  - [ ] Download button

### Priority 2: File Support
- [ ] Support PDF, docs, etc.
- [ ] File type icons
- [ ] File size display
- [ ] Download functionality

---

## 👥 Phase 5: Group Conversations (Hafta 7)

### Priority 1: Group Creation
- [ ] **New Group Modal**
  - [ ] Group title input
  - [ ] Member selection (multi-select)
  - [ ] Create group action
  - [ ] Add members

### Priority 2: Group Management
- [ ] **Member Management**
  - [ ] View members list
  - [ ] Add new members (admin only)
  - [ ] Remove members (admin only)
  - [ ] Leave group

- [ ] **Group Settings**
  - [ ] Edit group title
  - [ ] Change group avatar
  - [ ] Delete group (creator only)

---

## 🟢 Phase 6: Presence (Hafta 8)

### Priority 1: Online Status
- [ ] **User Status Table**
  - [ ] Create user_status table
  - [ ] Online/offline/away states
  - [ ] Last seen timestamp

- [ ] **Heartbeat System**
  - [ ] Client heartbeat (30s interval)
  - [ ] Update user_status on activity
  - [ ] Set offline on disconnect

### Priority 2: UI Updates
- [ ] **Status Indicators**
  - [ ] Online badge (green dot)
  - [ ] Last seen text
  - [ ] Status in conversation list
  - [ ] Status in user search

---

## 🔒 Phase 7: Moderation & Admin (Hafta 9)

### Priority 1: Reporting
- [ ] **Report System**
  - [ ] Report button on messages
  - [ ] Report reasons dropdown
  - [ ] Submit report action
  - [ ] Reports table

### Priority 2: Admin Panel
- [ ] **Admin Dashboard**
  - [ ] View all reports
  - [ ] User management
  - [ ] Ban/unban users
  - [ ] Delete conversations
  - [ ] View analytics

---

## 🧪 Phase 8: Testing & QA (Hafta 10)

### Priority 1: Unit Tests
- [ ] Component tests (Jest + RTL)
- [ ] Hook tests
- [ ] Utility function tests
- [ ] Server action tests

### Priority 2: Integration Tests
- [ ] API endpoint tests
- [ ] Database query tests
- [ ] Auth flow tests

### Priority 3: E2E Tests
- [ ] Sign up/login flow (Playwright)
- [ ] Send message flow
- [ ] Create conversation flow
- [ ] File upload flow

---

## 🚢 Phase 9: Deployment & CI/CD (Hafta 11)

### Priority 1: CI Pipeline
- [ ] **GitHub Actions**
  - [ ] Lint on PR
  - [ ] Run tests on PR
  - [ ] Build check
  - [ ] Type check

### Priority 2: Deployment
- [ ] **Vercel Setup**
  - [ ] Connect GitHub repo
  - [ ] Configure env variables
  - [ ] Set up preview deployments
  - [ ] Production deployment

- [ ] **Supabase Production**
  - [ ] Migrate production database
  - [ ] Configure storage
  - [ ] Set up backups

### Priority 3: Monitoring
- [ ] **Error Tracking**
  - [ ] Sentry integration
  - [ ] Error boundaries
  - [ ] Performance monitoring

- [ ] **Analytics**
  - [ ] Basic usage tracking
  - [ ] Conversation metrics
  - [ ] User engagement

---

## 🎁 Phase 10: Stretch Goals (Post-MVP)

### Nice-to-Have Features
- [x] **Message Reactions** ✅ TAMAMLANDI
  - [x] Emoji reactions
  - [x] Reaction counts
  - [x] Realtime reaction updates

- [x] **Typing Indicators** ✅ TAMAMLANDI
  - [x] Broadcast typing status
  - [x] Display "X is typing..."
  - [x] Timeout after inactivity

- [ ] **Message Search** 🔄 SONRAKİ
  - [ ] Full-text search
  - [ ] Search within conversation
  - [ ] Search across all conversations

- [ ] **Voice Messages**
  - [ ] Audio recording
  - [ ] Audio playback
  - [ ] Waveform visualization

- [ ] **Push Notifications**
  - [ ] Web Push API
  - [ ] Notification preferences
  - [ ] Unread count badge

- [ ] **Link Previews**
  - [ ] Detect URLs in messages
  - [ ] Fetch metadata
  - [ ] Display preview card

- [ ] **Message Threads**
  - [ ] Reply to specific message
  - [ ] Thread view
  - [ ] Thread notifications

- [ ] **End-to-End Encryption**
  - [ ] Key exchange
  - [ ] Encrypt messages client-side
  - [ ] Decrypt on receive

---

## 📊 Sprint Planning Template

### Sprint 1 (Week 1-2): Foundation
- Profile completion
- Landing page
- Basic navigation

### Sprint 2 (Week 3-4): Core Messaging
- User search
- DM creation
- Send/receive messages

### Sprint 3 (Week 5): Message Features
- Edit/delete messages
- Read receipts

### Sprint 4 (Week 6): File Upload
- Image upload
- File support

### Sprint 5 (Week 7): Group Conversations
- Group creation
- Member management

### Sprint 6 (Week 8): Presence
- Online status
- Last seen

### Sprint 7 (Week 9): Moderation
- Reporting
- Admin panel

### Sprint 8 (Week 10): Testing
- Unit tests
- E2E tests

### Sprint 9 (Week 11): Deployment
- CI/CD
- Production launch

---

## ✅ Daily Checklist Template

```markdown
## Today's Goals
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Blockers
- None

## Notes
- 

## Tomorrow
- [ ] Next task
```

---

## 🎯 Current Focus (Hemen Yapılacaklar)

### Immediate Next Steps:
1. **Profile Completion Page** ✨ EN ÖNCELİKLİ
   - Username seçimi
   - Avatar upload
   - Display name

2. **User Search**
   - Search bar component
   - Username arama
   - Search results

3. **DM Creation**
   - Create conversation action
   - Message button
   - Redirect to chat

Bu 3 özellik tamamlanınca temel flow çalışır olacak!
