# Realtime Architecture & Subscriptions

## 🔥 Supabase Realtime Overview

Campfire, tüm gerçek zamanlı işlemler için **Supabase Realtime** kullanır. WebSocket bağlantısı üzerinden PostgreSQL değişikliklerini dinler.

---

## 📡 Core Realtime Subscriptions

### 1. Messages Subscription
Her conversation için mesaj değişikliklerini dinle

```typescript
// hooks/useMessages.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles(username, avatar_url)')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      
      setMessages(data || []);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? (payload.new as Message) : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return messages;
}
```

---

### 2. Conversation List Subscription
Yeni mesaj geldiğinde conversation listesini güncelle

```typescript
// hooks/useConversations.ts
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_members!inner(user_id),
          last_message:messages(content, created_at)
        `)
        .order('updated_at', { ascending: false });
      
      setConversations(data || []);
    };

    fetchConversations();

    // Subscribe to new conversations
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_members'
        },
        () => {
          // Refetch when user is added to new conversation
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          // Update specific conversation
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === payload.new.id ? { ...conv, ...payload.new } : conv
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return conversations;
}
```

---

### 3. Message Reads Subscription
Okundu bilgisi güncellemeleri

```typescript
// hooks/useMessageReads.ts
export function useMessageReads(messageId: string) {
  const [reads, setReads] = useState<MessageRead[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchReads = async () => {
      const { data } = await supabase
        .from('message_reads')
        .select('*, user:profiles(username, avatar_url)')
        .eq('message_id', messageId);
      
      setReads(data || []);
    };

    fetchReads();

    const channel = supabase
      .channel(`message_reads:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads',
          filter: `message_id=eq.${messageId}`
        },
        (payload) => {
          setReads((prev) => [...prev, payload.new as MessageRead]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  return reads;
}
```

---

### 4. Typing Indicators (Optional - Post-MVP)

```typescript
// hooks/useTypingIndicator.ts
export function useTypingIndicator(conversationId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const supabase = createClient();

  // Broadcast typing status
  const broadcastTyping = async (isTyping: boolean) => {
    const channel = supabase.channel(`typing:${conversationId}`);
    
    if (isTyping) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId }
      });
    } else {
      await channel.send({
        type: 'broadcast',
        event: 'stopped_typing',
        payload: { userId: currentUserId }
      });
    }
  };

  // Listen to typing events
  useEffect(() => {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers((prev) => [...new Set([...prev, payload.userId])]);
      })
      .on('broadcast', { event: 'stopped_typing' }, ({ payload }) => {
        setTypingUsers((prev) => prev.filter((id) => id !== payload.userId));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { typingUsers, broadcastTyping };
}
```

---

### 5. User Presence (Online/Offline)

```typescript
// hooks/usePresence.ts
export function usePresence() {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: currentUserId
        }
      }
    });

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Online users:', Object.keys(state));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('User joined:', key);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('User left:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString()
          });
        }
      });

    // Heartbeat
    const heartbeat = setInterval(() => {
      channel.track({
        online_at: new Date().toISOString()
      });
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
    };
  }, []);
}
```

---

## 🎯 Optimistic UI Updates

Kullanıcı deneyimini geliştirmek için mesaj gönderirken optimistic update yapıyoruz:

```typescript
// components/Composer.tsx
async function sendMessage(content: string) {
  // 1. Optimistic update
  const tempMessage = {
    id: `temp-${Date.now()}`,
    conversation_id: conversationId,
    sender_id: currentUserId,
    content,
    created_at: new Date().toISOString(),
    status: 'sending' // Custom status
  };
  
  setMessages((prev) => [...prev, tempMessage]);

  try {
    // 2. Actual API call
    const newMessage = await sendMessageAction({
      conversationId,
      content
    });

    // 3. Replace temp with real message
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === tempMessage.id ? newMessage : msg
      )
    );
  } catch (error) {
    // 4. Rollback on error
    setMessages((prev) =>
      prev.filter((msg) => msg.id !== tempMessage.id)
    );
    toast.error('Failed to send message');
  }
}
```

---

## 🔄 Connection Management

```typescript
// lib/supabase/realtime.ts
export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel('system');

    channel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isConnected };
}
```

---

## ⚡ Performance Best Practices

### 1. Channel Cleanup
Her zaman cleanup yapın:
```typescript
return () => {
  supabase.removeChannel(channel);
};
```

### 2. Filter Kullanın
Sadece ilgili verileri dinleyin:
```typescript
.on('postgres_changes', {
  filter: `conversation_id=eq.${conversationId}`
})
```

### 3. Debounce Typing Events
```typescript
const debouncedTyping = useDebouncedCallback((isTyping) => {
  broadcastTyping(isTyping);
}, 300);
```

### 4. Batch Updates
Çok fazla güncelleme geliyorsa batch'leyin:
```typescript
const [pendingUpdates, setPendingUpdates] = useState([]);

useEffect(() => {
  const interval = setInterval(() => {
    if (pendingUpdates.length > 0) {
      applyUpdates(pendingUpdates);
      setPendingUpdates([]);
    }
  }, 100);

  return () => clearInterval(interval);
}, [pendingUpdates]);
```

---

## 🐛 Error Handling

```typescript
const channel = supabase
  .channel('messages')
  .on('postgres_changes', { ... }, (payload) => {
    try {
      handleNewMessage(payload);
    } catch (error) {
      console.error('Failed to handle message:', error);
      // Sentry error logging
      Sentry.captureException(error);
    }
  })
  .subscribe((status, err) => {
    if (err) {
      console.error('Subscription error:', err);
      // Retry logic
      setTimeout(() => {
        channel.subscribe();
      }, 5000);
    }
  });
```
