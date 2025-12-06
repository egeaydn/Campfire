# Deployment Guide

## 🚀 Vercel Deployment

### Prerequisites
- GitHub account with repository access
- Vercel account (sign up at vercel.com)
- Supabase project (production)

---

## Step 1: Prepare Environment Variables

Create these secrets in your Supabase project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### How to get Supabase credentials:
1. Go to your Supabase project dashboard
2. Click on **Settings** → **API**
3. Copy **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
4. Copy **anon/public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)

---

## Step 2: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository (`egeaydn/Campfire`)

2. **Configure Project**
   - Framework Preset: **Next.js**
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_production_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at: `https://campfire-xxx.vercel.app`

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

---

## Step 3: Configure GitHub Secrets (for CI)

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These are used by GitHub Actions for the build step.

---

## Step 4: Supabase Production Setup

### Database Migration

Run the following SQL in your **production** Supabase SQL Editor:

```sql
-- Run all migration files in order:
-- 1. Initial schema (profiles, conversations, messages, etc.)
-- 2. Groups migration
-- 3. Presence migration
-- 4. Moderation migration

-- Verify tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Storage Configuration

1. Create bucket: `message-files`
   - Go to **Storage** → **New bucket**
   - Name: `message-files`
   - Public: ✅ Yes

2. Set storage policies (already defined in migrations)

### Enable Realtime

1. Go to **Database** → **Replication**
2. Enable for these tables:
   - ✅ `messages`
   - ✅ `conversations`
   - ✅ `conversation_members`
   - ✅ `user_status`
   - ✅ `profiles`

---

## Step 5: Post-Deployment Checklist

- [ ] Test authentication (sign up/login)
- [ ] Test profile creation
- [ ] Send a test message
- [ ] Upload a test file
- [ ] Test realtime updates (open in 2 browsers)
- [ ] Test admin dashboard (create admin user)
- [ ] Check error logs in Vercel dashboard

---

## 🔄 Continuous Deployment

Every push to `master` branch will:
1. ✅ Run linting
2. ✅ Run type checks
3. ✅ Run tests
4. ✅ Build project
5. ✅ Deploy to Vercel (automatic)

### Preview Deployments
- Every PR gets a preview URL
- Test changes before merging
- Automatic cleanup after merge

---

## 📊 Monitoring & Analytics

### Vercel Dashboard
- **Analytics**: User traffic, page views
- **Logs**: Real-time function logs
- **Performance**: Core Web Vitals
- **Deployments**: History and rollback

Access: https://vercel.com/dashboard

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check build locally first
npm run build

# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Missing dependencies
```

### Environment Variables Not Working
- Make sure variables start with `NEXT_PUBLIC_`
- Redeploy after adding new variables
- Check Vercel dashboard → Settings → Environment Variables

### Database Connection Issues
- Verify Supabase URL and anon key
- Check RLS policies are enabled
- Verify production database is migrated

---

## 🔐 Security Checklist

- [ ] Environment variables set in Vercel (not in code)
- [ ] RLS policies enabled on all tables
- [ ] Storage bucket policies configured
- [ ] Admin users table populated
- [ ] No sensitive data in git history
- [ ] CORS configured in Supabase

---

## 📈 Next Steps

1. **Custom Domain** (Optional)
   - Add domain in Vercel settings
   - Update DNS records
   - Enable automatic HTTPS

2. **Error Tracking** (Recommended)
   - Setup Sentry for error monitoring
   - Add to `sentry.config.js`

3. **Performance Monitoring**
   - Enable Vercel Analytics
   - Setup Web Vitals tracking

---

## 🎉 You're Live!

Your app is now deployed and ready for users. Share the URL and start collecting feedback!

**Production URL**: `https://your-app.vercel.app`
