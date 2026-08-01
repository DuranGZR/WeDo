export type PasswordStrength = {
  score: number;
  label: 'Zayıf' | 'Orta' | 'Güçlü' | 'Çok güçlü';
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
    score <= 1 ? 'Zayıf' : score <= 2 ? 'Orta' : score === 3 ? 'Güçlü' : 'Çok güçlü';
  return { score, label, checks };
}

export function isStrongPassword(password: string) {
  return getPasswordStrength(password).score === 4;
}
