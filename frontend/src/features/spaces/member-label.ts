import { t } from '@/i18n';

export function memberRoleLabel(role: string): string {
  if (role === 'owner') return t('members.owner');
  if (role === 'admin') return t('members.admin');
  return t('members.member');
}
