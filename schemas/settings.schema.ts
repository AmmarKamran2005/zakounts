import { z } from 'zod';

export const settingsSchema = z.object({
  srRate: z.number().positive('Must be positive'),
  usdRate: z.number().positive('Must be positive'),
  cadRate: z.number().positive('Must be positive'),
  goldPrice: z.number().positive('Must be positive'),
  silverPrice: z.number().positive('Must be positive'),
  nisabType: z.enum(['gold', 'silver']),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
