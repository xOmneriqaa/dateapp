import { Button } from "@/components/ui/button";
import { Loader2, Upload, User } from "lucide-react";
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
      <label className="text-lg font-bold">Profile Photo</label>
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-gray-100 flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-16 w-16 text-muted-foreground" />
            )}
          </div>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Photo
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Max 5MB. JPG, PNG, or GIF.
          </p>
        </div>
      </div>
    </div>
  );
}
