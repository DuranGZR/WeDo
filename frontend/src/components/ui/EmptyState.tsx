import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { SLIDE_SPRING } from '@/components/motion/springs';
import { colors, shadows, spacing } from '@/design-system';
import { AppText } from './AppText';
import { Button } from './Button';

export function EmptyState({
  title,
  description,
  action,
  onAction,
  secondaryAction,
  onSecondaryAction,
  icon = 'sparkles-outline',
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  secondaryAction?: string;
  onSecondaryAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const reducedMotion = useReducedMotion();
  const anim = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      anim.set(1);
      return;
    }
    anim.set(0);
    anim.set(withSpring(1, SLIDE_SPRING));
  }, [anim, reducedMotion]);

  const containerStyle = useAnimatedStyle(() => {
    const val = anim.get();
    return {
      opacity: val,
      transform: [{ scale: 0.94 + 0.06 * val }, { translateY: (1 - val) * 12 }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.outerRing}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={30} color={colors.primaryText} />
        </View>
      </View>
      <AppText variant="sectionTitle" style={styles.title}>
        {title}
      </AppText>
      <AppText muted style={styles.description}>
        {description}
      </AppText>
      {action && onAction ? (
        <View style={styles.actionContainer}>
          <Button
            label={action}
            onPress={onAction}
            variant="primary"
            hapticFeedback="medium"
          />
          {secondaryAction && onSecondaryAction ? (
            <Button
              label={secondaryAction}
              onPress={onSecondaryAction}
              variant="secondary"
              hapticFeedback="light"
            />
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  outerRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: 'rgba(158, 127, 96, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    backgroundColor: 'rgba(205, 185, 163, 0.16)',
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  description: {
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
    fontSize: 14,
  },
  actionContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
    width: '100%',
    maxWidth: 280,
  },
});
