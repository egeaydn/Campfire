import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatView } from "@/components/chat/ChatView";
import { ConversationList } from "@/components/sidebar/ConversationList";
import { Loader2 } from "lucide-react";

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function ChatContent({ conversationId }: { conversationId: string }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    redirect("/auth/login");
  }

  const userId = user.sub;

  // Verify user is a member of this conversation
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!membership) {
    redirect("/");
  }

  // Get conversation details
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select(`
      id,
      type,
      title,
      conversation_members(
        user_id,
        role,
        profile:profiles(username, display_name, avatar_url)
      )
    `)
    .eq("id", conversationId)
    .single();

  if (convError || !conversation) {
    console.error('Conversation not found:', convError);
    redirect("/");
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-80 border-r flex flex-col">
        <ConversationList currentUserId={userId} />
      </aside>

      {/* Chat View */}
      <main className="flex-1">
        <ChatView conversation={conversation} currentUserId={userId} />
      </main>
    </div>
  );
}

export default function ChatPage({ params }: ChatPageProps) {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ChatContentWrapper params={params} />
    </Suspense>
  );
}

async function ChatContentWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatContent conversationId={id} />;
}
