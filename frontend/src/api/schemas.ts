import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
  email_verified: z.boolean(),
  onboarding_completed: z.boolean(),
  notify_partner_activity: z.boolean().default(true),
  push_notifications_enabled: z.boolean().default(true),
  created_at: z.string(),
});

export const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  user: userSchema,
});

export const pageResponseSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    pagination: z.object({
      page: z.number(),
      page_size: z.number(),
      has_more: z.boolean(),
    }),
  });

export type User = z.infer<typeof userSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
