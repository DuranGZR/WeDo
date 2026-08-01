import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  signInSchema,
  signUpSchema,
  type SignInValues,
  type SignUpValues,
} from './schemas';

export function useSignInForm() {
  return useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
}
export function useSignUpForm() {
  return useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', passwordConfirmation: '', displayName: '' },
  });
}
