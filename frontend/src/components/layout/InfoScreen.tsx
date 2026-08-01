import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Screen } from '@/components/ui';
import { spacing } from '@/design-system';

export function InfoScreen({
  title,
  description,
  action = 'Geri dön',
  onAction,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
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
