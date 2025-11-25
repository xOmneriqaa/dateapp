import { z } from "zod";

/**
 * Zod Validation Schemas
 * These schemas mirror Convex validators and provide client-side validation
 */

// ============ ENUMS ============

export const GenderSchema = z.enum(["male", "female", "other"]);
export type Gender = z.infer<typeof GenderSchema>;

export const GenderPreferenceSchema = z.enum(["male", "female", "both"]);
export type GenderPreference = z.infer<typeof GenderPreferenceSchema>;

export const ReportReasonSchema = z.enum([
  "harassment",
  "spam",
  "inappropriate",
  "threats",
  "other",
]);
export type ReportReason = z.infer<typeof ReportReasonSchema>;

export const ReportStatusSchema = z.enum([
  "pending",
  "reviewed",
  "actioned",
  "dismissed",
]);
export type ReportStatus = z.infer<typeof ReportStatusSchema>;

// ============ PROFILE ============

export const ProfileUpdateSchema = z.object({
  age: z
    .number()
    .int("Age must be a whole number")
    .min(18, "You must be at least 18 years old")
    .max(100, "Age must be 100 or less")
    .optional(),
  gender: GenderSchema.optional(),
  genderPreference: GenderPreferenceSchema.optional(),
  bio: z
    .string()
    .max(500, "Bio must be 500 characters or less")
    .optional(),
});

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

// Form validation (requires age, gender, genderPreference)
export const ProfileFormSchema = z.object({
  age: z
    .number()
    .int("Age must be a whole number")
    .min(18, "You must be at least 18 years old")
    .max(100, "Age must be 100 or less"),
  gender: GenderSchema,
  genderPreference: GenderPreferenceSchema,
  bio: z
    .string()
    .max(500, "Bio must be 500 characters or less")
    .optional()
    .default(""),
});

export type ProfileForm = z.infer<typeof ProfileFormSchema>;

// ============ MESSAGES ============

export const MessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long (max 2000 characters)"),
});

export type Message = z.infer<typeof MessageSchema>;

// For encrypted messages
export const EncryptedMessageSchema = z.object({
  encryptedContent: z.string().min(1, "Encrypted content is required"),
  nonce: z.string().min(1, "Nonce is required"),
});

export type EncryptedMessage = z.infer<typeof EncryptedMessageSchema>;

// ============ REPORTS ============

export const ReportMessageSchema = z.object({
  decryptedContent: z.string().min(1, "Message content is required"),
  reason: ReportReasonSchema,
  details: z
    .string()
    .max(1000, "Details must be 1000 characters or less")
    .optional(),
});

export type ReportMessage = z.infer<typeof ReportMessageSchema>;

// ============ FILE UPLOAD ============

export const ImageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.type.startsWith("image/"), {
      message: "Please select an image file",
    })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Image must be less than 5MB",
    }),
});

export type ImageUpload = z.infer<typeof ImageUploadSchema>;

// ============ HELPER FUNCTIONS ============

/**
 * Safely parse and validate data with Zod schema
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Get first error message (Zod 4 uses 'issues' instead of 'errors')
  const firstIssue = result.error.issues[0];
  return { success: false, error: firstIssue?.message || "Validation failed" };
}

/**
 * Parse age from string input
 */
export function parseAge(value: string): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Validate profile form data
 */
export function validateProfileForm(data: {
  age: string;
  gender: string;
  genderPreference: string;
  bio: string;
}): { success: true; data: ProfileForm } | { success: false; error: string } {
  const age = parseAge(data.age);

  if (age === undefined) {
    return { success: false, error: "Age is required" };
  }

  if (!data.gender) {
    return { success: false, error: "Gender is required" };
  }

  if (!data.genderPreference) {
    return { success: false, error: "Gender preference is required" };
  }

  return safeValidate(ProfileFormSchema, {
    age,
    gender: data.gender,
    genderPreference: data.genderPreference,
    bio: data.bio || undefined,
  });
}
