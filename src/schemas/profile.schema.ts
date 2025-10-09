import { z } from 'zod';

// Profile creation schema
export const ProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be at most 100 characters'),
  bio: z
    .string()
    .max(141, 'Bio must be at most 141 characters')
    .default(''),
  avatarUrl: z.string().url().nullish(),
});

// Avatar upload schema (for file validation)
export const AvatarUploadSchema = z.object({
  file: z
    .custom<Express.Multer.File>(
      (val) => val && typeof val === 'object' && 'mimetype' in val,
      'Must be a file'
    )
    .refine(
      (file) => file.mimetype.startsWith('image/'),
      'Must be an image file (JPG, PNG, GIF, WebP)'
    )
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB'
    ),
});

// Export TypeScript types
export type ProfileInput = z.infer<typeof ProfileSchema>;
