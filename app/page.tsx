import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConversationList } from "@/components/sidebar/ConversationList";
import { Loader2 } from "lucide-react";

async function DashboardContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-80 border-r flex flex-col">
        <ConversationList currentUserId={user.sub} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4 p-8">
          <h2 className="text-2xl font-semibold text-muted-foreground">
            Select a conversation
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose from your existing conversations or start a new one
          </p>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
