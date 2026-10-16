import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  signInSchema,
  signUpSchema,
  type SignInValues,
  type SignUpValues,
} from './schemas';

export function useSignInForm() {
  const { i18n } = useTranslation();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
  useEffect(() => {
    if (form.formState.isSubmitted) void form.trigger();
  }, [i18n.resolvedLanguage, form]);
  return form;
}
export function useSignUpForm() {
  const { i18n } = useTranslation();
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', passwordConfirmation: '', displayName: '' },
  });
  useEffect(() => {
    if (form.formState.isSubmitted) void form.trigger();
  }, [i18n.resolvedLanguage, form]);
  return form;
}
