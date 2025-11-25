import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ImagePlus, X, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { ImageUploadSchema } from "@/lib/validations";

interface ChatInputProps {
  newMessage: string;
  chatEnded: boolean;
  isSending: boolean;
  isExtended: boolean; // Show image upload only in extended phase
  isUploading?: boolean;
  onTypingChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onImageSelect?: (file: File) => void;
}

export function ChatInput({
  newMessage,
  chatEnded,
  isSending,
  isExtended,
  isUploading = false,
  onTypingChange,
  onSendMessage,
  onImageSelect,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Cleanup preview URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate with Zod schema
    const result = ImageUploadSchema.safeParse({ file });
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || "Invalid file";
      toast.error(errorMessage);
      return;
    }

    // Revoke previous preview URL if exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendImage = () => {
    if (selectedFile && onImageSelect) {
      onImageSelect(selectedFile);
      handleCancelPreview();
    }
  };

  return (
    <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur">
      {/* Image Preview */}
      {previewUrl && (
        <div className="px-6 pt-4 pb-2">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-32 rounded-lg border border-border"
            />
            <button
              onClick={handleCancelPreview}
              className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
              disabled={isUploading}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-2">
            <Button
              onClick={handleSendImage}
              disabled={isUploading || chatEnded}
              size="sm"
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Image
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={onSendMessage} className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Image upload button - only in extended phase */}
          {isExtended && !previewUrl && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
                disabled={chatEnded || isUploading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={chatEnded || isUploading}
                className="shrink-0"
                title="Send image"
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
            </>
          )}

          <Input
            type="text"
            placeholder={chatEnded ? "Chat has ended" : "Type a message..."}
            value={newMessage}
            onChange={(e) => onTypingChange(e.target.value)}
            className="flex-1"
            disabled={chatEnded || isUploading}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || chatEnded || isSending || isUploading}
            className="px-6 shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
