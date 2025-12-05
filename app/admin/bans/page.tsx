import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBannedUsers, unbanUser } from "@/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ban, UserCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

async function BansContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!adminCheck) {
    redirect("/");
  }

  const bannedUsers = await getBannedUsers();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ban className="w-8 h-8" />
            Banned Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user bans and restrictions
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {bannedUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ban className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No banned users</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bannedUsers.map((ban) => {
            const isExpired = ban.expires_at && new Date(ban.expires_at) < new Date();
            const isActive = ban.permanent || !isExpired;

            return (
              <Card key={ban.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        User ID: {ban.user_id.slice(0, 8)}...
                        {isActive ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge variant="secondary">Expired</Badge>
                        )}
                        {ban.permanent && (
                          <Badge variant="outline">Permanent</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Banned on {new Date(ban.banned_at).toLocaleString()}
                        {ban.expires_at && !ban.permanent && (
                          <> • Expires: {new Date(ban.expires_at).toLocaleString()}</>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">User ID:</h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      {ban.user_id}
                    </p>
                  </div>

                  {ban.reason && (
                    <div>
                      <h4 className="font-semibold mb-1">Reason:</h4>
                      <p className="text-sm text-muted-foreground">
                        {ban.reason}
                      </p>
                    </div>
                  )}

                  {isActive && (
                    <div className="pt-2">
                      <form action={async () => {
                        "use server";
                        await unbanUser(ban.user_id);
                      }}>
                        <Button type="submit" variant="outline" size="sm">
                          <UserCheck className="w-4 h-4 mr-1" />
                          Unban User
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default async function BansPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Loading banned users...</div>}>
      <BansContent />
    </Suspense>
  );
}
