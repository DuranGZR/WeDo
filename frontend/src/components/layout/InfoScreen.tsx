import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, Button, Card, Screen } from '@/components/ui';
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
  const reducedMotion = useReducedMotion();
  return (
    <Screen>
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.duration(240)}
        layout={reducedMotion ? undefined : LAYOUT_SPRING}
        style={styles.content}
      >
        <Card variant="elevated" style={styles.card}>
          <AppText variant="largeTitle">{title}</AppText>
          <AppText muted>{description}</AppText>
          <Button label={action} onPress={onAction ?? (() => router.back())} />
        </Card>
      </Animated.View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    gap: spacing.lg,
  },
});
