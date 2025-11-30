# Quick Reference - Hızlı Başvuru

## 🔥 Hemen Kullanılacak Code Snippets

### Supabase Client (Client-Side)
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Supabase Client (Server-Side)
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

---

## 📦 Useful Hooks

### useAuth
```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

### useProfile
```typescript
// hooks/useProfile.ts
export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => setProfile(data));
  }, [userId]);

  return profile;
}
```

---

## 🎨 Common UI Patterns

### Loading State
```typescript
if (loading) {
  return <div className="flex items-center justify-center h-screen">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>;
}
```

### Empty State
```typescript
if (conversations.length === 0) {
  return <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
    <h3 className="font-semibold mb-2">No conversations yet</h3>
    <p className="text-sm text-muted-foreground mb-4">
      Start a conversation by searching for users
    </p>
    <Button>New Conversation</Button>
  </div>;
}
```

### Error State
```typescript
if (error) {
  return <div className="flex items-center justify-center h-screen">
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  </div>;
}
```

---

## 🔧 Utility Functions

### Format Date
```typescript
// lib/utils/date.ts
import { formatDistanceToNow, format } from 'date-fns';

export function formatMessageTime(date: string) {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return formatDistanceToNow(messageDate, { addSuffix: true });
  } else if (diffInHours < 168) { // 7 days
    return format(messageDate, 'EEE HH:mm');
  } else {
    return format(messageDate, 'MMM d, yyyy');
  }
}
```

### Debounce
```typescript
// lib/utils/debounce.ts
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

---

## 📝 Server Actions Template

```typescript
// app/actions/conversations.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createConversation({
  type,
  title,
  memberIds
}: CreateConversationInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Unauthorized');

  // Create conversation
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ type, title, created_by: user.id })
    .select()
    .single();
    
  if (error) throw error;

  // Add members
  const members = [user.id, ...memberIds].map(id => ({
    conversation_id: conv.id,
    user_id: id
  }));
  
  await supabase.from('conversation_members').insert(members);
  
  revalidatePath('/chat');
  
  return conv;
}
```

---

## 🎯 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # Server-only!
```

---

## 🚀 Common Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Linting
npm run lint

# Type check
npm run type-check

# Tests
npm run test
npm run test:watch
npm run test:e2e

# Database
npm run db:push    # Push schema changes
npm run db:seed    # Seed database
npm run db:reset   # Reset database
```

---

## 📚 Important Links

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)

### Supabase
- [Dashboard](https://supabase.com/dashboard)
- [Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Storage Docs](https://supabase.com/docs/guides/storage)
- [Auth Docs](https://supabase.com/docs/guides/auth)

### Deployment
- [Vercel Dashboard](https://vercel.com/dashboard)

---

## 🐛 Common Issues & Solutions

### Issue: Realtime not working
```typescript
// Make sure you're subscribing correctly
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}` // ✅ Don't forget filter!
  }, handleNewMessage)
  .subscribe();

// ✅ Always cleanup
return () => {
  supabase.removeChannel(channel);
};
```

### Issue: RLS blocking queries
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View existing policies
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

### Issue: File upload failing
```typescript
// ✅ Make sure bucket exists and has proper policies
const { data, error } = await supabase.storage
  .from('message-files')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  });

// Check storage policies in Supabase dashboard
```

---

## 🎨 Tailwind Utility Classes

### Layout
```html
<div class="flex flex-col h-screen">
  <header class="border-b p-4">Header</header>
  <main class="flex-1 overflow-y-auto">Content</main>
  <footer class="border-t p-4">Footer</footer>
</div>
```

### Responsive
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Cards -->
</div>
```

### Dark Mode
```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

---

## ✅ PR Checklist

```markdown
- [ ] Code builds without errors
- [ ] Tests pass
- [ ] Linting passes
- [ ] Type checking passes
- [ ] No console.log statements
- [ ] Error handling added
- [ ] Loading states implemented
- [ ] Responsive design checked
- [ ] Accessibility considered
- [ ] Performance optimized
```
