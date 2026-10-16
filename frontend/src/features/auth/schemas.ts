import { t } from '@/i18n';
import { z } from 'zod';

import { isStrongPassword } from './password-strength';

export const signInSchema = z.object({
  email: z.string().email({ error: () => t('auth.enterAValidEmailAddress') }),
  password: z
    .string()
    .min(8, { error: () => t('auth.yourPasswordMustBeAtLeast8Characters') }),
});

export const signUpSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, { error: () => t('auth.yourNameMustBeAtLeast2Characters') })
      .max(80, { error: () => t('auth.nameTooLong') }),
    email: z.string().email({ error: () => t('auth.enterAValidEmailAddress') }),
    password: z
      .string()
      .min(8, { error: () => t('auth.yourPasswordMustBeAtLeast8Characters') })
      .refine(isStrongPassword, {
        error: () => t('auth.addAnUppercaseLetterALowercaseLetterAndANumber'),
      }),
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    error: () => t('auth.passwordsDonTMatch'),
    path: ['passwordConfirmation'],
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
