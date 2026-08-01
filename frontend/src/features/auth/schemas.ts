import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Geçerli bir e-posta yazın.'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı.'),
});
export const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().min(2, 'Ad en az 2 karakter olmalı.').max(80),
});
export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
