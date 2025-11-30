# UI Components Architecture

## 🎨 Component Hierarchy

```
app/
├── layout.tsx (Root Layout + Theme Provider)
├── page.tsx (Landing/Dashboard)
├── chat/
│   └── [conversationId]/
│       └── page.tsx (Chat View)
└── profile/
    └── complete/
        └── page.tsx (Profile Completion)

components/
├── auth/
│   ├── SignUpForm.tsx
│   ├── SignInForm.tsx
│   └── AuthButton.tsx
├── chat/
│   ├── Sidebar.tsx
│   ├── ConversationList.tsx
│   ├── ConversationItem.tsx
│   ├── ChatView.tsx
│   ├── MessageList.tsx
│   ├── MessageItem.tsx
│   ├── Composer.tsx
│   ├── FileUpload.tsx
│   └── TypingIndicator.tsx
├── profile/
│   ├── ProfileModal.tsx
│   ├── AvatarUpload.tsx
│   └── UserCard.tsx
├── search/
│   ├── SearchBar.tsx
│   └── SearchResults.tsx
├── modals/
│   ├── NewConversationModal.tsx
│   └── NewGroupModal.tsx
└── ui/ (Shadcn components)
    ├── button.tsx
    ├── input.tsx
    ├── avatar.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    └── ...
```

---

## 🧩 Core Components

### 1. Sidebar Component

**Purpose**: Conversation list + search + new conversation

```typescript
// components/chat/Sidebar.tsx
import { useConversations } from '@/hooks/useConversations';
import { ConversationList } from './ConversationList';
import { SearchBar } from '@/components/search/SearchBar';

export function Sidebar() {
  const conversations = useConversations();

  return (
    <aside className="w-80 border-r border-border bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Campfire</h2>
      </div>

      {/* Search */}
      <div className="p-4">
        <SearchBar placeholder="Search users..." />
      </div>

      {/* New Conversation Button */}
      <div className="px-4 pb-4">
        <NewConversationModal />
      </div>

      {/* Conversation List */}
      <ConversationList conversations={conversations} />
    </aside>
  );
}
```

---

### 2. Chat View Component

**Purpose**: Main chat interface (messages + composer)

```typescript
// components/chat/ChatView.tsx
import { useMessages } from '@/hooks/useMessages';
import { MessageList } from './MessageList';
import { Composer } from './Composer';

interface ChatViewProps {
  conversationId: string;
}

export function ChatView({ conversationId }: ChatViewProps) {
  const messages = useMessages(conversationId);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b p-4">
        <h3 className="font-semibold">Conversation Title</h3>
      </header>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Composer */}
      <Composer conversationId={conversationId} />
    </div>
  );
}
```

---

### 3. Message Item Component

**Purpose**: Individual message display

```typescript
// components/chat/MessageItem.tsx
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

export function MessageItem({ message, isOwn }: MessageItemProps) {
  return (
    <div className={cn(
      "flex gap-3 p-4",
      isOwn && "flex-row-reverse"
    )}>
      {/* Avatar */}
      <Avatar src={message.sender.avatar_url} />

      {/* Content */}
      <div className={cn(
        "flex flex-col",
        isOwn && "items-end"
      )}>
        {/* Sender name + timestamp */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{message.sender.username}</span>
          <span>{formatDistanceToNow(new Date(message.created_at))}</span>
        </div>

        {/* Message bubble */}
        <div className={cn(
          "mt-1 px-4 py-2 rounded-lg max-w-md",
          isOwn 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary"
        )}>
          <p>{message.content}</p>
          
          {/* File preview */}
          {message.file_url && (
            <img src={message.file_url} className="mt-2 rounded" />
          )}
        </div>

        {/* Edited indicator */}
        {message.edited_at && (
          <span className="text-xs text-muted-foreground mt-1">
            (edited)
          </span>
        )}

        {/* Message actions (edit/delete) */}
        {isOwn && (
          <MessageActions
            onEdit={() => handleEdit(message.id)}
            onDelete={() => handleDelete(message.id)}
          />
        )}
      </div>
    </div>
  );
}
```

---

### 4. Composer Component

**Purpose**: Message input + file upload + send

```typescript
// components/chat/Composer.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Send } from 'lucide-react';

interface ComposerProps {
  conversationId: string;
}

export function Composer({ conversationId }: ComposerProps) {
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSend = async () => {
    if (!content.trim()) return;

    await sendMessage({ conversationId, content });
    setContent('');
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const fileUrl = await uploadFile(file);
    await sendMessage({ conversationId, fileUrl });
    setUploading(false);
  };

  return (
    <div className="border-t p-4">
      <div className="flex gap-2 items-center">
        {/* File upload */}
        <FileUpload onUpload={handleFileUpload} disabled={uploading}>
          <Button variant="ghost" size="icon">
            <Upload className="w-4 h-4" />
          </Button>
        </FileUpload>

        {/* Input */}
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1"
        />

        {/* Send button */}
        <Button onClick={handleSend} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
```

---

### 5. Conversation List Component

```typescript
// components/chat/ConversationList.tsx
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
  conversations: Conversation[];
}

export function ConversationList({ conversations }: ConversationListProps) {
  return (
    <div className="overflow-y-auto">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
        />
      ))}
    </div>
  );
}
```

---

### 6. Search Bar Component

```typescript
// components/search/SearchBar.tsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const search = useDebouncedCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const users = await searchUsers(q);
    setResults(users);
  }, 300);

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          search(e.target.value);
        }}
        placeholder="Search users..."
        className="pl-10"
      />
      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
      
      {results.length > 0 && (
        <SearchResults results={results} />
      )}
    </div>
  );
}
```

---

### 7. New Conversation Modal

```typescript
// components/modals/NewConversationModal.tsx
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function NewConversationModal() {
  const [open, setOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleCreate = async () => {
    await createConversation({
      type: selectedUsers.length > 1 ? 'group' : 'dm',
      memberIds: selectedUsers
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="w-full">
        New Conversation
      </Button>

      <DialogContent>
        <DialogHeader>New Conversation</DialogHeader>
        
        {/* User selection */}
        <UserSelector
          selected={selectedUsers}
          onChange={setSelectedUsers}
        />

        <Button onClick={handleCreate}>Create</Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🎨 Styling Guidelines

### Tailwind Config
```javascript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'campfire-purple': '#3A0CA3',
        'campfire-mid': '#5D2FE2',
        'campfire-bg': '#0C0B10',
        'accent-fire': '#FF7A3D',
      }
    }
  }
}
```

### Dark Mode (Default)
```typescript
// app/layout.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem
>
  {children}
</ThemeProvider>
```

---

## ♿ Accessibility

- ✅ Semantic HTML (`<main>`, `<aside>`, `<article>`)
- ✅ ARIA labels for interactive elements
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Screen reader friendly

Example:
```typescript
<button
  aria-label="Send message"
  aria-disabled={!content}
  onClick={handleSend}
>
  <Send />
</button>
```

---

## 📱 Responsive Design

```typescript
// Mobile layout
<div className="flex flex-col md:flex-row">
  {/* Sidebar: full-screen on mobile, sidebar on desktop */}
  <Sidebar className="w-full md:w-80" />
  
  {/* Chat: hidden on mobile when sidebar open */}
  <ChatView className="flex-1" />
</div>
```
