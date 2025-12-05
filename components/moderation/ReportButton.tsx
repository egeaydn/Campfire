"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag, Loader2 } from "lucide-react";
import { reportMessage, type ReportReason } from "@/app/actions/reports";

interface ReportButtonProps {
  messageId: string;
  variant?: "button" | "menuItem";
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "other", label: "Other" },
];

export function ReportButton({ messageId, variant = "button" }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;

    setLoading(true);
    try {
      await reportMessage({
        messageId,
        reason,
        description: description.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setDescription("");
      }, 2000);
    } catch (error: any) {
      console.error("Report failed:", error);
      alert(error.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "menuItem") {
    return (
      <>
        <div
          onClick={() => setOpen(true)}
          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
          <Flag className="w-4 h-4 mr-2" />
          Report
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Message</DialogTitle>
              <DialogDescription>
                Help us keep Campfire safe by reporting inappropriate content.
              </DialogDescription>
            </DialogHeader>

            {submitted ? (
              <div className="py-8 text-center">
                <p className="text-green-600 font-medium">
                  ✓ Report submitted successfully
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Our moderation team will review this report.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Select
                      value={reason}
                      onValueChange={(value) => setReason(value as ReportReason)}
                    >
                      <SelectTrigger id="reason">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORT_REASONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Additional Details (Optional)
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Provide more context about why you're reporting this message..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      disabled={loading}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading || !reason}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Flag className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Message</DialogTitle>
            <DialogDescription>
              Help us keep Campfire safe by reporting inappropriate content.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="py-8 text-center">
              <p className="text-green-600 font-medium">
                ✓ Report submitted successfully
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Our moderation team will review this report.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Select
                    value={reason}
                    onValueChange={(value) => setReason(value as ReportReason)}
                  >
                    <SelectTrigger id="reason">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Additional Details (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide more context about why you're reporting this message..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    disabled={loading}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading || !reason}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
