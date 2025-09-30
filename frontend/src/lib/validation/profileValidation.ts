import { z } from 'zod';
import { isValidCountryCode } from '@/i18n/countries';

export const nicknameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_]+$/)
  .min(3)
  .max(24);

export const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((val) => {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return d <= now && d.getFullYear() > 1900;
  }, { message: 'Invalid birth date' });

export const countrySchema = z
  .string()
  .refine((code) => isValidCountryCode(code), { message: 'Invalid country' });

export const profileUpdateSchema = z.object({
  fullName: z.string().max(120).optional(),
  nickname: nicknameSchema.optional(),
  birthDate: birthDateSchema.optional(),
  country: countrySchema.optional(),
  language: z.enum(['en','es','fr']).optional(),
  gender: z.string().max(40).optional(),
  pronouns: z.string().max(40).optional(),
  bio: z.string().max(500).optional(),
  tags: z.array(z.string().min(1).max(40)).max(10).optional(),
});

export type ProfileUpdateInputValidated = z.infer<typeof profileUpdateSchema>;


