import { Button } from "@/components/ui/button";
import { Upload, User } from "lucide-react";
import { useRef } from "react";

interface ProfilePhotoSectionProps {
  previewUrl: string | null;
  isUploading: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfilePhotoSection({ previewUrl, isUploading, onFileSelect }: ProfilePhotoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground block">Profile Photo</label>
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
              <Upload className="h-5 w-5 text-muted-foreground animate-pulse" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
            {previewUrl ? 'Change' : 'Upload'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Max 5MB • JPG, PNG
          </p>
        </div>
      </div>
    </div>
  );
}
