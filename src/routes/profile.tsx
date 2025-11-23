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

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const profile = useQuery(api.profile.get);
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

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
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

      // Update profile
      await updateProfile({
        age: age ? parseInt(age) : undefined,
        gender: gender as any,
        genderPreference: genderPreference as any,
        bio: bio || undefined,
        photoStorageId,
      });

      toast.success('Profile updated successfully!');
      navigate({ to: '/dashboard' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const isValid = age && parseInt(age) >= 18 && gender && genderPreference;

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-4 fade-in">
          <div className="inline-flex items-center gap-3 px-5 py-2 border border-border rounded-full text-sm uppercase tracking-[0.3em] text-muted-foreground">
            <UserRoundPen className="h-5 w-5" />
            Profile
          </div>
          <h1 className="text-5xl font-bold">Edit Profile</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tell us about yourself to help us find better matches
          </p>
        </div>

        <div className="slide-up">
          <div className="space-y-10 bg-card p-8 rounded-2xl shadow-soft-lg">
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

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-border">
              <Button
                onClick={handleSave}
                disabled={!isValid || isSaving}
                size="lg"
                className="flex-1 py-7 text-lg rounded-2xl transition-smooth"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/dashboard' })}
                size="lg"
                className="px-12 py-7 text-lg rounded-2xl transition-smooth"
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
