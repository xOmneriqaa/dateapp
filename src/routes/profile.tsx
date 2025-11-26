import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/tanstack-react-start';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ProfilePhotoSection } from '@/components/profile/ProfilePhotoSection';
import { ProfileFormFields } from '@/components/profile/ProfileFormFields';
import { UserRoundPen } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { validateProfileForm, type Gender, type GenderPreference } from '@/lib/validations';

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser();
  // Skip query until user is signed in to prevent "Unauthenticated" errors
  const profile = useQuery(api.profile.get, isSignedIn ? {} : "skip");
  const updateProfile = useMutation(api.profile.update);
  const generateUploadUrl = useMutation(api.profile.generateUploadUrl);
  const canAccess = useRequireAuth({ isLoaded, isSignedIn, navigate });

  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [genderPreference, setGenderPreference] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setAge(profile.age?.toString() || '');
      setGender(profile.gender || '');
      setGenderPreference(profile.genderPreference || '');
      setBio(profile.bio || '');
      if (profile.photos && profile.photos.length > 0) {
        setPreviewUrl(profile.photos[0]);
      }
    }
  }, [profile]);

  if (!canAccess) {
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Revoke previous object URL to prevent memory leak
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    // Validate form data with Zod
    const validation = validateProfileForm({ age, gender, genderPreference, bio });
    if (!validation.success) {
      toast.error(validation.error);
      return;
    }

    const { data: validatedData } = validation;

    try {
      setIsSaving(true);

      let photoStorageId = undefined;

      // Upload photo if selected
      if (selectedFile) {
        setIsUploading(true);
        const uploadUrl = await generateUploadUrl();

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': selectedFile.type },
          body: selectedFile,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload photo');
        }

        const { storageId } = await uploadResponse.json();
        photoStorageId = storageId;
        setIsUploading(false);
      }

      // Update profile with validated data (properly typed, no 'as any')
      await updateProfile({
        age: validatedData.age,
        gender: validatedData.gender as Gender,
        genderPreference: validatedData.genderPreference as GenderPreference,
        bio: validatedData.bio || undefined,
        photoStorageId,
      });

      toast.success('Profile updated successfully!');
      navigate({ to: '/dashboard' });
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const isValid = age && parseInt(age) >= 18 && gender && genderPreference;

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:py-8 pb-24 sm:pb-8">
      <div className="max-w-lg mx-auto space-y-4 sm:space-y-6">
        <div className="text-center space-y-2 fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-md text-xs text-muted-foreground">
            <UserRoundPen className="h-4 w-4" />
            Profile
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold">Edit Profile</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tell us about yourself
          </p>
        </div>

        <div className="slide-up">
          <div className="space-y-5 sm:space-y-6 bg-card p-4 sm:p-5 rounded-xl border border-border">
            <ProfilePhotoSection
              previewUrl={previewUrl}
              isUploading={isUploading}
              onFileSelect={handleFileSelect}
            />

            <ProfileFormFields
              age={age}
              setAge={setAge}
              gender={gender}
              setGender={setGender}
              genderPreference={genderPreference}
              setGenderPreference={setGenderPreference}
              bio={bio}
              setBio={setBio}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              <Button
                onClick={handleSave}
                disabled={!isValid || isSaving}
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/dashboard' })}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
