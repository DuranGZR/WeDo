import { z } from 'zod';

import { ApiClientError, apiClient } from '@/api/client/api-client';

export const verificationChallengeSchema = z.object({
  verification_id: z.string().uuid(),
  email: z.string().email(),
  resend_after_seconds: z.number().int().nonnegative(),
  expires_in_seconds: z.number().int().nonnegative(),
});
export type VerificationChallenge = z.infer<typeof verificationChallengeSchema>;

export function getVerificationChallenge(error: unknown): VerificationChallenge | null {
  if (
    !(error instanceof ApiClientError) ||
    error.payload.error?.code !== 'EMAIL_VERIFICATION_REQUIRED'
  )
    return null;
  const parsed = verificationChallengeSchema.safeParse(error.payload.error.details);
  return parsed.success ? parsed.data : null;
}

export async function verifyEmail(verificationId: string, code: string): Promise<void> {
  await apiClient('/api/v1/auth/verify-email', {
    method: 'POST',
    body: { verification_id: verificationId, code },
  });
}

export async function resendVerification(
  verificationId: string,
): Promise<VerificationChallenge> {
  return verificationChallengeSchema.parse(
    await apiClient('/api/v1/auth/resend-verification', {
      method: 'POST',
      body: { verification_id: verificationId },
    }),
  );
}
