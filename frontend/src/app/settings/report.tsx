import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, TextField } from '@/components/ui';
import {
  AccountCard,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { safetyApi, type ReportReason, type ReportReceipt } from '@/features/safety/api';
import { mono, spacing } from '@/design-system';
import { t } from '@/i18n';

const reasons = [
  { value: 'harassment', key: 'safety.reasonHarassment' },
  { value: 'sexual', key: 'safety.reasonSexual' },
  { value: 'violence', key: 'safety.reasonViolence' },
  { value: 'spam', key: 'safety.reasonSpam' },
  { value: 'copyright', key: 'safety.reasonCopyright' },
  { value: 'other', key: 'safety.reasonOther' },
] as const;

export default function ReportScreen() {
  useTranslation();
  const params = useLocalSearchParams<{
    targetType?: string;
    targetId?: string;
    spaceId?: string;
    name?: string;
  }>();
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [details, setDetails] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<ReportReceipt | null>(null);
  const targetType =
    params.targetType === 'item' || params.targetType === 'user'
      ? params.targetType
      : 'app';
  const submit = async () => {
    setPending(true);
    setError('');
    try {
      setReceipt(
        await safetyApi.report({
          target_type: targetType,
          target_id: targetType === 'app' ? undefined : params.targetId,
          space_id: params.spaceId,
          reason,
          details: details.trim(),
        }),
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('common.tryAgainShort'));
    } finally {
      setPending(false);
    }
  };

  return (
    <AccountScaffold title={t('safety.report')} subtitle={t('safety.reportDescription')}>
      {receipt ? (
        <AccountCard>
          <Ionicons name="checkmark-circle-outline" size={32} color={mono.ink} />
          <AppText variant="sectionTitle">{t('safety.reportSaved')}</AppText>
          <AppText>{t('safety.reportSavedDescription')}</AppText>
          <AppText selectable>{t('safety.reference', { id: receipt.id })}</AppText>
        </AccountCard>
      ) : (
        <AccountCard>
          {params.name ? (
            <AppText>{t('safety.regarding', { name: params.name })}</AppText>
          ) : null}
          <AppText variant="sectionTitle">{t('safety.chooseReason')}</AppText>
          <View style={styles.reasons}>
            {reasons.map((entry) => (
              <Pressable
                key={entry.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: reason === entry.value }}
                disabled={pending}
                accessibilityLabel={t(entry.key)}
                onPress={() => setReason(entry.value)}
                style={[styles.reason, reason === entry.value && styles.selected]}
              >
                <Ionicons
                  name={reason === entry.value ? 'radio-button-on' : 'radio-button-off'}
                  size={19}
                  color={mono.ink}
                />
                <AppText>{t(entry.key)}</AppText>
              </Pressable>
            ))}
          </View>
          <TextField
            label={t('safety.details')}
            placeholder={t('safety.detailsPlaceholder')}
            multiline
            maxLength={2000}
            value={details}
            onChangeText={setDetails}
            editable={!pending}
            style={styles.details}
          />
          <AppText muted style={accountStyles.note}>
            {t('safety.detailsHint')}
          </AppText>
          {error ? (
            <AppText accessibilityRole="alert" style={styles.error}>
              {error}
            </AppText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('safety.sendReport')}
            disabled={pending || details.trim().length < 10}
            onPress={() => void submit()}
            style={[
              accountStyles.primaryButton,
              (pending || details.trim().length < 10) && styles.disabled,
            ]}
          >
            {pending ? (
              <ActivityIndicator color={mono.paper} />
            ) : (
              <Ionicons name="flag-outline" size={18} color={mono.paper} />
            )}
            <AppText style={accountStyles.primaryButtonText}>
              {t('safety.sendReport')}
            </AppText>
          </Pressable>
        </AccountCard>
      )}
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  reasons: { gap: spacing.xs },
  reason: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mono.line,
  },
  selected: { backgroundColor: mono.soft, borderColor: mono.ink },
  details: { minHeight: 120, textAlignVertical: 'top', paddingTop: spacing.md },
  error: { color: mono.danger },
  disabled: { opacity: 0.5 },
});
