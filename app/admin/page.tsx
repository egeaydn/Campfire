import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function AdminCheck() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/auth/login");
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  if (!adminCheck) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Moderate content and manage users
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/reports">
          <div className="border rounded-lg p-6 hover:bg-accent transition-colors cursor-pointer">
            <h3 className="font-semibold text-lg">Reports</h3>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage user reports
            </p>
          </div>
        </Link>

        <Link href="/admin/bans">
          <div className="border rounded-lg p-6 hover:bg-accent transition-colors cursor-pointer">
            <h3 className="font-semibold text-lg">Banned Users</h3>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage user bans
            </p>
          </div>
        </Link>

        <Link href="/">
          <div className="border rounded-lg p-6 hover:bg-accent transition-colors cursor-pointer">
            <h3 className="font-semibold text-lg">Back to App</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Return to main application
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <AdminCheck />
      </Suspense>
    </div>
  );
}
