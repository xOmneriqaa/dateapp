import { Input } from "@/components/ui/input";

interface ProfileFormFieldsProps {
  age: string;
  setAge: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  genderPreference: string;
  setGenderPreference: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
}

export function ProfileFormFields({
  age,
  setAge,
  gender,
  setGender,
  genderPreference,
  setGenderPreference,
  bio,
  setBio,
}: ProfileFormFieldsProps) {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Age */}
      <div className="space-y-2">
        <label className="text-xs sm:text-sm font-medium text-foreground">Age *</label>
        <Input
          type="number"
          placeholder="Enter your age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          min="18"
          max="100"
        />
        {age && parseInt(age) < 18 && (
          <p className="text-xs text-destructive">
            You must be at least 18 years old
          </p>
        )}
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <label className="text-xs sm:text-sm font-medium text-foreground">I am *</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setGender(option.value)}
              className={`py-2.5 sm:py-2 px-2 sm:px-3 rounded-md border text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                gender === option.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-foreground border-border hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gender Preference */}
      <div className="space-y-2">
        <label className="text-xs sm:text-sm font-medium text-foreground">Interested in *</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'male', label: 'Men' },
            { value: 'female', label: 'Women' },
            { value: 'both', label: 'Everyone' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setGenderPreference(option.value)}
              className={`py-2.5 sm:py-2 px-2 sm:px-3 rounded-md border text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                genderPreference === option.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-foreground border-border hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs sm:text-sm font-medium text-foreground">About Me</label>
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            {bio.length}/500
          </span>
        </div>
        <textarea
          placeholder="Tell us about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-sm focus:outline-none focus:border-muted-foreground/50 transition-colors resize-none"
        />
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          Share your interests or what you're looking for
        </p>
      </div>
    </div>
  );
}
