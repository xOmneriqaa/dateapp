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
    <div className="space-y-8">
      {/* Age */}
      <div className="space-y-2">
        <label className="text-lg font-bold">Age *</label>
        <Input
          type="number"
          placeholder="Enter your age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          min="18"
          max="100"
        />
        {age && parseInt(age) < 18 && (
          <p className="text-sm text-destructive">
            You must be at least 18 years old
          </p>
        )}
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <label className="text-lg font-bold">I am *</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setGender(option.value)}
              className={`py-4 px-6 border-2 border-black font-bold transition-all ${
                gender === option.value
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gender Preference */}
      <div className="space-y-2">
        <label className="text-lg font-bold">Interested in *</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'male', label: 'Men' },
            { value: 'female', label: 'Women' },
            { value: 'both', label: 'Everyone' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setGenderPreference(option.value)}
              className={`py-4 px-6 border-2 border-black font-bold transition-all ${
                genderPreference === option.value
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-50'
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
          <label className="text-lg font-bold">About Me</label>
          <span className="text-sm text-muted-foreground">
            {bio.length}/500
          </span>
        </div>
        <textarea
          placeholder="Tell us about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={6}
          className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-4 focus:ring-black/20 font-mono resize-none"
        />
      </div>
    </div>
  );
}
