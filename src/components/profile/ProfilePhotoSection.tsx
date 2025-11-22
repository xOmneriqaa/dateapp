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
    <div className="space-y-4">
      <label className="text-xl font-semibold text-foreground">Profile Photo</label>
      <div className="flex items-center gap-8">
        <div className="relative group">
          <div className="w-36 h-36 rounded-full border-4 border-border overflow-hidden bg-muted flex items-center justify-center shadow-soft transition-smooth group-hover:shadow-soft-lg">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-20 w-20 text-muted-foreground/50" />
            )}
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-pulse">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium mt-2">Uploading...</p>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 rounded-xl transition-smooth"
            disabled={isUploading}
          >
            <Upload className="h-5 w-5" />
            {previewUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Max 5MB • JPG, PNG, or GIF<br />
            Square photos work best
          </p>
        </div>
      </div>
    </div>
  );
}
