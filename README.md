# Campfire - Real-time Messaging App

A modern, real-time messaging application built with Next.js 16, Supabase, and TypeScript.

## 🚀 Features

- ✅ **Authentication** - Sign up, login with Supabase Auth
- ✅ **Real-time Messaging** - Instant message delivery with Supabase Realtime
- ✅ **Direct Messages** - One-on-one conversations
- ✅ **Group Chats** - Create and manage group conversations
- ✅ **File Upload** - Share images and documents
- ✅ **User Presence** - Online/offline status tracking
- ✅ **Message Features** - Edit, delete messages with read receipts
- ✅ **Moderation** - Report system and admin dashboard
- ✅ **Responsive Design** - Works on desktop and mobile

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Shadcn/ui
- **Testing**: Jest + React Testing Library + Playwright
- **Deployment**: Vercel

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Campfire
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com/dashboard)
   - Copy `.env.example` to `.env.local`
   - Add your Supabase project URL and anon key:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Run database migrations**
   - Execute the SQL files in order from the SQL Editor in your Supabase dashboard:
     1. `supabase-setup.sql`
     2. `supabase-realtime-setup.sql`
     3. `supabase-group-chat-setup.sql`
     4. `supabase-moderation-setup.sql`

5. **Create storage bucket**
   - In Supabase dashboard: Storage → Create bucket → `message-files` (public)

6. **Enable Realtime**
   - Database → Replication → Enable for: `messages`, `conversations`, `conversation_members`, `user_status`, `profiles`

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Create your first admin user** (optional)
   ```sql
   INSERT INTO admin_users (user_id, role)
   VALUES ('your-user-id-from-auth-users', 'admin');
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for comprehensive deployment instructions for Vercel and production Supabase setup.

Quick steps:
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main

## Project Structure

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

## Roadmap

See [docs/07-ROADMAP.md](docs/07-ROADMAP.md) for the full development roadmap.

**Completed:**
- ✅ Phase 1-6: Core messaging, DMs, groups, files, presence
- ✅ Phase 7: Moderation & admin dashboard
- ✅ Phase 8: Testing infrastructure
- ✅ Phase 9: CI/CD & deployment

**Next Steps (Stretch Goals):**
- Message reactions
- Typing indicators
- Full-text search
- Voice messages
- Push notifications
- Link previews
- Message threads
- End-to-end encryption

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
