import { StyleSheet, View } from 'react-native';

import { spacing } from '@/design-system';
import { AppText } from './AppText';
import { Button } from './Button';

export function EmptyState({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.container}>
      <AppText variant="sectionTitle">{title}</AppText>
      <AppText muted style={styles.description}>
        {description}
      </AppText>
      {action && onAction ? (
        <Button label={action} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.huge, gap: spacing.sm },
  description: { textAlign: 'center', maxWidth: 300 },
});
