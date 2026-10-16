import { t } from '@/i18n';
import { z } from 'zod';

export const sharePayloadSchema = z
  .object({
    sharedText: z.string().optional(),
    url: z.string().url().optional(),
    imageUri: z.string().optional(),
    mimeType: z.string().optional(),
    sourceApp: z.string().optional(),
  })
  .refine((value) => Boolean(value.url || value.sharedText || value.imageUri), {
    error: () => t('sharing.sharedContentCanTBeEmpty'),
  });
export type SharePayload = z.infer<typeof sharePayloadSchema>;
