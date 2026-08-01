import { ApiClientError } from '@/api/client/api-client';

export function getAuthSubmitError(error: unknown, mode: 'sign-in' | 'sign-up'): string {
  if (error instanceof ApiClientError) {
    if (error.status === 409 && mode === 'sign-up') {
      return 'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.';
    }
    if (error.status === 401 && mode === 'sign-in') {
      return 'E-posta veya şifre hatalı. Bilgilerini kontrol edip tekrar dene.';
    }
    if (error.status === 429) {
      return 'Çok fazla deneme yapıldı. Lütfen bir dakika sonra tekrar dene.';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'İşlem tamamlanamadı. Lütfen tekrar dene.';
}
