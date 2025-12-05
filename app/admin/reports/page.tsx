import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReports } from "@/app/actions/reports";
import { updateReportStatus } from "@/app/actions/reports";
import { banUser } from "@/app/actions/admin";
import { deleteMessage } from "@/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Ban, Trash2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

async function ReportsContent() {
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

  const reports = await getReports();

  const statusColors = {
    pending: "bg-yellow-500",
    reviewed: "bg-blue-500",
    resolved: "bg-green-500",
    dismissed: "bg-gray-500",
  };

  const reasonLabels = {
    spam: "Spam",
    harassment: "Harassment",
    inappropriate: "Inappropriate Content",
    other: "Other",
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertCircle className="w-8 h-8" />
            User Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage user reports
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reports found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      Report #{report.id.slice(0, 8)}
                      <Badge className={statusColors[report.status as keyof typeof statusColors]}>
                        {report.status}
                      </Badge>
                      <Badge variant="outline">
                        {reasonLabels[report.reason as keyof typeof reasonLabels]}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Reported on {new Date(report.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">Reported User ID:</h4>
                  <p className="text-sm font-mono">
                    {report.reported_user_id}
                  </p>
                </div>

                {report.reported_message_id && (
                  <div>
                    <h4 className="font-semibold mb-1">Reported Message ID:</h4>
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      {report.reported_message_id}
                    </p>
                  </div>
                )}

                {report.description && (
                  <div>
                    <h4 className="font-semibold mb-1">Description:</h4>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  </div>
                )}

                {report.admin_notes && (
                  <div>
                    <h4 className="font-semibold mb-1">Admin Notes:</h4>
                    <p className="text-sm text-muted-foreground italic">
                      {report.admin_notes}
                    </p>
                  </div>
                )}

                {report.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <form action={async () => {
                      "use server";
                      await updateReportStatus({ reportId: report.id, status: "reviewed" });
                    }}>
                      <Button type="submit" variant="outline" size="sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Reviewed
                      </Button>
                    </form>

                    {report.reported_message_id && (
                      <form action={async () => {
                        "use server";
                        await deleteMessage(report.reported_message_id!);
                        await updateReportStatus({ reportId: report.id, status: "resolved", adminNotes: "Message deleted" });
                      }}>
                        <Button type="submit" variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete Message
                        </Button>
                      </form>
                    )}

                    <form action={async () => {
                      "use server";
                      await banUser({
                        userId: report.reported_user_id,
                        reason: "Banned due to report #" + report.id.slice(0, 8),
                        permanent: true
                      });
                      await updateReportStatus({ reportId: report.id, status: "resolved", adminNotes: "User banned" });
                    }}>
                      <Button type="submit" variant="destructive" size="sm">
                        <Ban className="w-4 h-4 mr-1" />
                        Ban User
                      </Button>
                    </form>

                    <form action={async () => {
                      "use server";
                      await updateReportStatus({ reportId: report.id, status: "dismissed", adminNotes: "No action needed" });
                    }}>
                      <Button type="submit" variant="ghost" size="sm">
                        <XCircle className="w-4 h-4 mr-1" />
                        Dismiss
                      </Button>
                    </form>
                  </div>
                )}

                {report.status === "reviewed" && (
                  <div className="flex gap-2 pt-2">
                    {report.reported_message_id && (
                      <form action={async () => {
                        "use server";
                        await deleteMessage(report.reported_message_id!);
                        await updateReportStatus({ reportId: report.id, status: "resolved", adminNotes: "Message deleted" });
                      }}>
                        <Button type="submit" variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete Message
                        </Button>
                      </form>
                    )}

                    <form action={async () => {
                      "use server";
                      await banUser({
                        userId: report.reported_user_id,
                        reason: "Banned due to report #" + report.id.slice(0, 8),
                        permanent: true
                      });
                      await updateReportStatus({ reportId: report.id, status: "resolved", adminNotes: "User banned" });
                    }}>
                      <Button type="submit" variant="destructive" size="sm">
                        <Ban className="w-4 h-4 mr-1" />
                        Ban User
                      </Button>
                    </form>

                    <form action={async () => {
                      "use server";
                      await updateReportStatus({ reportId: report.id, status: "resolved", adminNotes: "Action taken" });
                    }}>
                      <Button type="submit" variant="outline" size="sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Resolved
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function ReportsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Loading reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
