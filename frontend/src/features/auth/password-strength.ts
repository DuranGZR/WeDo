import { t } from '@/i18n';
export type PasswordStrength = {
  score: number;
  label: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    digit: boolean;
  };
};

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const label =
    score <= 1
      ? t('auth.weak')
      : score <= 2
        ? t('auth.fair')
        : score === 3
          ? t('auth.strong')
          : t('auth.veryStrong');
  return { score, label, checks };
}

export function isStrongPassword(password: string) {
  return getPasswordStrength(password).score === 4;
}
