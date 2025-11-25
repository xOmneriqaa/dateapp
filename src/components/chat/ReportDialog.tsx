import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Flag, X } from "lucide-react";
import { ReportMessageSchema, type ReportReason } from "@/lib/validations";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: Id<"messages">;
  chatSessionId: Id<"chatSessions">;
  messageContent: string; // The decrypted content to include in report
}

const REPORT_REASONS = [
  { value: "harassment" as const, label: "Harassment" },
  { value: "spam" as const, label: "Spam" },
  { value: "inappropriate" as const, label: "Inappropriate Content" },
  { value: "threats" as const, label: "Threats" },
  { value: "other" as const, label: "Other" },
];

export function ReportDialog({
  isOpen,
  onClose,
  messageId,
  chatSessionId,
  messageContent,
}: ReportDialogProps) {
  const [reason, setReason] = useState<typeof REPORT_REASONS[number]["value"] | null>(null);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportMessage = useMutation(api.reports.reportMessage);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validate with Zod schema
    const validation = ReportMessageSchema.safeParse({
      decryptedContent: messageContent,
      reason,
      details: details.trim() || undefined,
    });

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || "Invalid report data";
      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      await reportMessage({
        messageId,
        chatSessionId,
        decryptedContent: validation.data.decryptedContent,
        reason: validation.data.reason as ReportReason,
        details: validation.data.details,
      });

      toast.success("Report submitted. Thank you for helping keep our community safe.");
      onClose();
    } catch (error: unknown) {
      console.error("Failed to submit report:", error);
      const message = error instanceof Error ? error.message : "Failed to submit report";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-background border-2 border-border rounded-xl shadow-3d p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-bold">Report Message</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Message preview */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="text-muted-foreground text-xs mb-1">Message:</p>
            <p className="break-words">
              {messageContent.length > 200
                ? messageContent.slice(0, 200) + "..."
                : messageContent}
            </p>
          </div>

          {/* Reason selection */}
          <div>
            <p className="text-sm font-medium mb-2">Why are you reporting this?</p>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                    reason === r.value
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional details */}
          <div>
            <label className="text-sm font-medium">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context..."
              className="mt-1 w-full px-3 py-2 text-sm border-2 border-border rounded-lg
                       focus:outline-none focus:border-primary resize-none"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Privacy note */}
          <p className="text-xs text-muted-foreground">
            The message content will be shared with our moderation team for review.
            Your identity will be kept confidential.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting || !reason}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
