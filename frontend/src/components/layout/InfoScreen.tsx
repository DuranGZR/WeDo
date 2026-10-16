import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Screen } from '@/components/ui';
import { spacing } from '@/design-system';

export function InfoScreen({
  title,
  description,
  action = t('common.goBack_e0c40'),
  onAction,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  useTranslation();
  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="pageTitle">{title}</AppText>
        <AppText muted>{description}</AppText>
        <Button label={action} onPress={onAction ?? (() => router.back())} />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', gap: spacing.lg },
});
