import { z } from 'zod';

import { isStrongPassword } from './password-strength';

export const signInSchema = z.object({
  email: z.string().email('Geçerli bir e-posta yazın.'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı.'),
});

export const signUpSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Ad en az 2 karakter olmalı.').max(80),
    email: z.string().email('Geçerli bir e-posta yazın.'),
    password: z
      .string()
      .min(8, 'Şifre en az 8 karakter olmalı.')
      .refine(isStrongPassword, 'Büyük harf, küçük harf ve rakam ekle.'),
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: 'Şifreler eşleşmiyor.',
    path: ['passwordConfirmation'],
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
