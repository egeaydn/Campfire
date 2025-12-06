import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { Loader2 } from "lucide-react";

export default async function SearchPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Search Messages</h1>
          <p className="text-muted-foreground">
            Search across all your conversations
          </p>
        </div>

        <SearchBar />
      </div>
    </div>
  );
}
