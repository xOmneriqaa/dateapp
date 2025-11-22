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
    <div className="space-y-10">
      {/* Age */}
      <div className="space-y-3">
        <label className="text-xl font-semibold text-foreground">Age *</label>
        <Input
          type="number"
          placeholder="Enter your age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          min="18"
          max="100"
          className="h-14 text-lg rounded-xl border-2 border-border focus:border-primary transition-smooth"
        />
        {age && parseInt(age) < 18 && (
          <p className="text-sm text-destructive font-medium">
            You must be at least 18 years old
          </p>
        )}
      </div>

      {/* Gender */}
      <div className="space-y-3">
        <label className="text-xl font-semibold text-foreground">I am *</label>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setGender(option.value)}
              className={`py-5 px-6 rounded-xl border-2 font-semibold transition-smooth shadow-soft-sm ${
                gender === option.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-soft'
                  : 'bg-background text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 hover:shadow-soft'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gender Preference */}
      <div className="space-y-3">
        <label className="text-xl font-semibold text-foreground">Interested in *</label>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 'male', label: 'Men' },
            { value: 'female', label: 'Women' },
            { value: 'both', label: 'Everyone' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setGenderPreference(option.value)}
              className={`py-5 px-6 rounded-xl border-2 font-semibold transition-smooth shadow-soft-sm ${
                genderPreference === option.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-soft'
                  : 'bg-background text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 hover:shadow-soft'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xl font-semibold text-foreground">About Me</label>
          <span className="text-sm text-muted-foreground font-medium">
            {bio.length}/500
          </span>
        </div>
        <textarea
          placeholder="Tell us about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={8}
          className="w-full px-5 py-4 border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:shadow-soft transition-smooth resize-none text-base leading-relaxed"
        />
        <p className="text-sm text-muted-foreground">
          Share your interests, hobbies, or what you're looking for
        </p>
      </div>
    </div>
  );
}
