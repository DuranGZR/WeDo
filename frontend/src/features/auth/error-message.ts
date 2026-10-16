import { t } from '@/i18n';
import { ApiClientError } from '@/api/client/api-client';

export function getAuthSubmitError(error: unknown, mode: 'sign-in' | 'sign-up'): string {
  if (error instanceof ApiClientError) {
    if (error.status === 409 && mode === 'sign-up') {
      return t('auth.anAccountWithThisEmailAlreadyExistsTrySigningIn');
    }
    if (error.status === 401 && mode === 'sign-in') {
      return t('auth.yourEmailOrPasswordIsIncorrectCheckYourDetailsAnd');
    }
    if (error.status === 429) {
      return t('auth.tooManyAttemptsPleaseTryAgainInAMinute');
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return t('auth.somethingWentWrongPleaseTryAgain_68489');
}
