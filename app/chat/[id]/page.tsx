import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatView } from "@/components/chat/ChatView";

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
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
    .eq("conversation_id", params.id)
    .eq("user_id", userId)
    .single();

  if (!membership) {
    redirect("/");
  }

  // Get conversation details
  const { data: conversation } = await supabase
    .from("conversations")
    .select(`
      id,
      type,
      title,
      conversation_members(
        user_id,
        profile:profiles(username, display_name, avatar_url)
      )
    `)
    .eq("id", params.id)
    .single();

  return <ChatView conversation={conversation} currentUserId={userId} />;
}
