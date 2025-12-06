<div align="center">

# 🔥 Campfire

### Modern Real-time Messaging Platform

*Connect, collaborate, and communicate in real-time with your team*

[![Next.js](https://img.shields.io/badge/Next.js-16.0.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

[🚀 Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [📦 Installation](#-installation) • [🎨 Screenshots](#-screenshots) • [📖 Documentation](#-documentation)

</div>

---

## 🌟 About

**Campfire** is a production-ready, feature-rich real-time messaging platform built with modern web technologies. Designed for teams and communities, it offers a seamless chat experience with enterprise-grade features including group chats, file sharing, moderation tools, and more.

### ✨ Why Campfire?

- 🚀 **Lightning Fast** - Built on Next.js 16 with Turbopack
- 🔒 **Secure** - Row Level Security (RLS) with Supabase
- 📱 **Responsive** - Beautiful UI on all devices
- 🎨 **Customizable** - Tailwind CSS with custom Campfire theme
- 🧪 **Well-tested** - Unit, integration, and E2E tests
- 📚 **Documented** - Comprehensive documentation

---

## 🚀 Features

### Core Messaging
- ✅ **Real-time Chat** - Instant message delivery with Supabase Realtime
- ✅ **Direct Messages** - One-on-one private conversations
- ✅ **Group Chats** - Create and manage group conversations with multiple members
- ✅ **Message Actions** - Edit, delete messages with full audit trail
- ✅ **Read Receipts** - Know when your messages are seen
- ✅ **Typing Indicators** - Real-time typing status
- ✅ **Message Reactions** - Express yourself with emoji reactions

### Rich Media & Content
- ✅ **File Sharing** - Upload and share images, documents (10MB limit)
- ✅ **Voice Messages** - Record and send audio messages
- ✅ **Link Previews** - Automatic Open Graph metadata fetching
- ✅ **Image Preview** - In-app image viewing
- ✅ **Drag & Drop** - Easy file uploads

### Search & Discovery
- ✅ **Full-text Search** - PostgreSQL FTS with highlighting
- ✅ **Global Search** - Search across all conversations
- ✅ **Message Threads** - Reply to specific messages
- ✅ **Conversation Search** - Find messages within chats

### User Experience
- ✅ **User Profiles** - Customizable profiles with avatars and bios
- ✅ **Online Status** - Real-time presence tracking
- ✅ **Push Notifications** - Web Push API support
- ✅ **Dark Mode** - Eye-friendly dark theme
- ✅ **Settings** - Customizable notification preferences
- ✅ **Responsive Design** - Mobile-first responsive UI

### Security & Moderation
- ✅ **Authentication** - Secure auth with Supabase Auth
- ✅ **Row Level Security** - Database-level security
- ✅ **Report System** - User-generated content moderation
- ✅ **Admin Dashboard** - Comprehensive moderation tools
- ✅ **User Blocking** - Block unwanted users
- ✅ **E2E Encryption Ready** - Schema prepared for encryption

### Developer Experience
- ✅ **TypeScript** - Fully typed codebase
- ✅ **Server Actions** - Next.js 16 server actions
- ✅ **Testing** - Jest + Playwright E2E tests
- ✅ **CI/CD** - GitHub Actions workflow
- ✅ **Hot Reload** - Turbopack for fast development

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16.0.4](https://nextjs.org/)** - React framework with App Router & Turbopack
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript 5.0](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 3.4](https://tailwindcss.com/)** - Utility-first CSS
- **[Shadcn/ui](https://ui.shadcn.com/)** - Re-usable component system
- **[Radix UI](https://www.radix-ui.com/)** - Headless UI primitives
- **[Lucide Icons](https://lucide.dev/)** - Beautiful icon set
- **[date-fns](https://date-fns.org/)** - Date formatting

### Backend & Database
- **[Supabase](https://supabase.com/)** - Backend as a Service
  - **PostgreSQL 15** - Relational database
  - **Realtime** - WebSocket connections
  - **Storage** - File storage (avatars, message files)
  - **Auth** - User authentication & session management
  - **Row Level Security** - Database-level authorization

### Search & Data
- **PostgreSQL Full-Text Search** - tsvector & GIN indexes
- **Server Actions** - Next.js server-side data mutations
- **React Server Components** - Zero-bundle size server components

### Testing
- **[Jest](https://jestjs.io/)** - Unit & integration testing
- **[React Testing Library](https://testing-library.com/react)** - Component testing
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[MSW](https://mswjs.io/)** - API mocking

### DevOps & Deployment
- **[Vercel](https://vercel.com/)** - Hosting & deployment
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipeline
- **Environment Variables** - Secure configuration management

### Media & Real-time Features
- **Web Audio API** - Voice message recording
- **MediaRecorder API** - Audio capture
- **Supabase Broadcast** - Real-time typing indicators
- **Web Push API** - Browser notifications
- **Open Graph Protocol** - Link preview metadata

### Code Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript Strict Mode** - Enhanced type checking
- **Git Hooks** - Pre-commit checks

---

## 🎨 Color Palette

Campfire uses a custom blue-gray color scheme:

```css
Primary: #1B3C53 (Dark Blue)
Secondary: #234C6A (Medium Blue)
Accent: #456882 (Light Blue)
Neutral: #E3E3E3 (Light Gray)
```

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Quick Start

1️⃣ **Clone the repository**
```bash
git clone https://github.com/egeaydn/Campfire.git
cd Campfire
```

2️⃣ **Install dependencies**
```bash
npm install
```

3️⃣ **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4️⃣ **Run database migrations**

Execute SQL files in Supabase SQL Editor (in order):
```
1. supabase-setup.sql
2. supabase-realtime-setup.sql
3. supabase-group-chat-setup.sql
4. supabase-moderation-setup.sql
5. supabase-reactions-setup.sql
6. supabase-typing-setup.sql
7. supabase-search-setup.sql
8. supabase-link-previews-setup.sql
9. supabase-push-notifications-setup.sql
10. supabase-threads-setup.sql
11. supabase-e2e-encryption-setup.sql
```

5️⃣ **Create storage buckets**

In Supabase Dashboard → Storage:
- `message-files` (public) - For message attachments
- `avatars` (public) - For user avatars

6️⃣ **Enable Realtime**

Database → Replication → Enable for:
- `messages`
- `conversations`
- `conversation_members`
- `user_status`
- `profiles`
- `message_reactions`

7️⃣ **Start development server**
```bash
npm run dev
```

8️⃣ **Open browser**
```
http://localhost:3000
```

### Optional: Create Admin User

After signing up, promote your account to admin:
```sql
INSERT INTO admin_users (user_id, role)
VALUES ('your-user-id-from-auth-users', 'admin');
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

---

## 📁 Project Structure

```
Campfire/
├── app/                      # Next.js App Router
│   ├── actions/             # Server actions
│   │   ├── files.ts         # File upload
│   │   ├── messages.ts      # Message CRUD
│   │   ├── profile.ts       # User profiles
│   │   ├── reactions.ts     # Message reactions
│   │   └── link-previews.ts # Link metadata
│   ├── api/                 # API routes
│   ├── auth/                # Authentication pages
│   │   ├── login/
│   │   ├── sign-up/
│   │   └── forgot-password/
│   ├── admin/               # Admin dashboard
│   ├── chat/[id]/           # Chat conversation page
│   ├── profile/             # User profile page
│   ├── settings/            # Settings page
│   ├── search/              # Global search page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
│
├── components/              # React components
│   ├── chat/               # Chat components
│   │   ├── ChatView.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageItem.tsx
│   │   ├── Composer.tsx
│   │   ├── VoiceRecorder.tsx
│   │   ├── EmojiPicker.tsx
│   │   ├── LinkPreviewCard.tsx
│   │   ├── ThreadView.tsx
│   │   └── TypingIndicator.tsx
│   ├── sidebar/            # Sidebar components
│   │   ├── ConversationList.tsx
│   │   └── SearchBar.tsx
│   ├── moderation/         # Moderation components
│   │   └── ReportButton.tsx
│   ├── profile/            # Profile components
│   │   └── ProfileView.tsx
│   ├── settings/           # Settings components
│   │   └── SettingsView.tsx
│   ├── ui/                 # Shadcn UI components
│   ├── auth-button.tsx
│   ├── hero.tsx
│   ├── Navbar.tsx
│   └── theme-switcher.tsx
│
├── lib/                    # Utilities
│   ├── supabase/          # Supabase clients
│   │   ├── client.ts      # Client-side
│   │   ├── server.ts      # Server-side
│   │   └── proxy.ts       # Proxy for SSR
│   └── utils.ts           # Utility functions
│
├── docs/                   # Documentation
│   ├── 01-PROJECT-OVERVIEW.md
│   ├── 02-DATABASE-SCHEMA.md
│   ├── 03-FEATURES.md
│   ├── 04-TESTING.md
│   ├── 05-DEPLOYMENT.md
│   ├── 06-MAINTENANCE.md
│   └── 07-ROADMAP.md
│
├── e2e/                    # E2E tests
│   └── example.spec.ts
│
├── public/                 # Static assets
│   └── campfire-logo.png
│
├── SQL/                    # Database migrations
│   ├── supabase-setup.sql
│   ├── supabase-realtime-setup.sql
│   ├── supabase-group-chat-setup.sql
│   ├── supabase-moderation-setup.sql
│   ├── supabase-reactions-setup.sql
│   ├── supabase-typing-setup.sql
│   ├── supabase-search-setup.sql
│   ├── supabase-link-previews-setup.sql
│   ├── supabase-push-notifications-setup.sql
│   ├── supabase-threads-setup.sql
│   └── supabase-e2e-encryption-setup.sql
│
├── .github/                # GitHub config
│   └── workflows/
│       └── ci.yml          # CI/CD pipeline
│
├── tailwind.config.ts      # Tailwind configuration
├── next.config.ts          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Jest configuration
├── playwright.config.ts    # Playwright configuration
└── package.json            # Dependencies
```

---

## 📖 Documentation

Comprehensive documentation available in `/docs`:

- **[Project Overview](docs/01-PROJECT-OVERVIEW.md)** - Architecture & design decisions
- **[Database Schema](docs/02-DATABASE-SCHEMA.md)** - Complete database structure
- **[Features](docs/03-FEATURES.md)** - Detailed feature documentation
- **[Testing](docs/04-TESTING.md)** - Testing strategy & guidelines
- **[Deployment](docs/05-DEPLOYMENT.md)** - Production deployment guide
- **[Maintenance](docs/06-MAINTENANCE.md)** - Maintenance & monitoring
- **[Roadmap](docs/07-ROADMAP.md)** - Development roadmap

---

## 🚢 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/egeaydn/Campfire)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automatically

### Production Checklist

- ✅ Run all database migrations
- ✅ Set up storage buckets
- ✅ Enable Realtime for all tables
- ✅ Configure CORS in Supabase
- ✅ Set up custom domain
- ✅ Enable SSL/HTTPS
- ✅ Configure environment variables
- ✅ Test authentication flow
- ✅ Verify file uploads work
- ✅ Test real-time features

---

## 🗺️ Roadmap

### ✅ Completed (Phase 1-10)
- Core messaging functionality
- Direct messages & group chats
- File uploads & sharing
- User presence & status
- Moderation & admin tools
- Testing infrastructure
- CI/CD pipeline
- Message reactions
- Typing indicators
- Full-text search
- Voice messages
- Link previews
- Message threads
- Profile management
- Settings page
- Navigation overhaul

### 🔜 Coming Soon
- [ ] End-to-end encryption implementation
- [ ] Video calls integration
- [ ] Screen sharing
- [ ] Custom emoji packs
- [ ] Message forwarding
- [ ] Pinned messages
- [ ] User roles & permissions
- [ ] API documentation
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Update documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Vercel](https://vercel.com/) - Deployment platform
- [Shadcn/ui](https://ui.shadcn.com/) - Component library
- [Radix UI](https://www.radix-ui.com/) - UI primitives

---

## 📧 Contact

**Project Maintainer:** Ege Aydın

**Repository:** [github.com/egeaydn/Campfire](https://github.com/egeaydn/Campfire)

---

<div align="center">

**Built with ❤️ using Next.js and Supabase**

⭐ Star this repo if you find it helpful!

</div>
8️⃣ **Open browser**
```
http://localhost:3000
```

### Optional: Create Admin User

After signing up, promote your account to admin:
```sql
INSERT INTO admin_users (user_id, role)
VALUES ('your-user-id-from-auth-users', 'admin');
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

---

## 📁 Project Structure

```
app/                    # Next.js app router pages
  actions/             # Server actions for data operations
  api/                 # API routes
  auth/                # Authentication pages
  admin/               # Admin dashboard pages
components/            # React components
  chat/                # Chat-related components
  moderation/          # Moderation components
  ui/                  # Shadcn UI components
lib/                   # Utilities and Supabase clients
docs/                  # Documentation
e2e/                   # Playwright E2E tests
```

---

## 📖 Documentation

Comprehensive documentation available in `/docs`:

- **[Project Overview](docs/01-PROJECT-OVERVIEW.md)** - Architecture & design decisions
- **[Database Schema](docs/02-DATABASE-SCHEMA.md)** - Complete database structure
- **[Features](docs/03-FEATURES.md)** - Detailed feature documentation
- **[Testing](docs/04-TESTING.md)** - Testing strategy & guidelines
- **[Deployment](docs/05-DEPLOYMENT.md)** - Production deployment guide
- **[Maintenance](docs/06-MAINTENANCE.md)** - Maintenance & monitoring
- **[Roadmap](docs/07-ROADMAP.md)** - Development roadmap

---

## 🚢 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/egeaydn/Campfire)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automatically

### Production Checklist

- ✅ Run all database migrations
- ✅ Set up storage buckets
- ✅ Enable Realtime for all tables
- ✅ Configure CORS in Supabase
- ✅ Set up custom domain
- ✅ Enable SSL/HTTPS
- ✅ Configure environment variables
- ✅ Test authentication flow
- ✅ Verify file uploads work
- ✅ Test real-time features

---

## 🗺️ Roadmap

### ✅ Completed (Phase 1-10)
- Core messaging functionality
- Direct messages & group chats
- File uploads & sharing
- User presence & status
- Moderation & admin tools
- Testing infrastructure
- CI/CD pipeline
- Message reactions
- Typing indicators
- Full-text search
- Voice messages
- Link previews
- Message threads
- Profile management
- Settings page
- Navigation overhaul

### 🔜 Coming Soon
- [ ] End-to-end encryption implementation
- [ ] Video calls integration
- [ ] Screen sharing
- [ ] Custom emoji packs
- [ ] Message forwarding
- [ ] Pinned messages
- [ ] User roles & permissions
- [ ] API documentation
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Update documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Vercel](https://vercel.com/) - Deployment platform
- [Shadcn/ui](https://ui.shadcn.com/) - Component library
- [Radix UI](https://www.radix-ui.com/) - UI primitives

---

## 📧 Contact

**Project Maintainer:** Ege Aydın

**Repository:** [github.com/egeaydn/Campfire](https://github.com/egeaydn/Campfire)

---

<div align="center">

**Built with ❤️ using Next.js and Supabase**

⭐ Star this repo if you find it helpful!

</div>
