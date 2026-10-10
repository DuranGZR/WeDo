import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import { mono, radius, spacing } from '@/design-system';
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
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      speed: 16,
      bounciness: 4,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: anim,
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.94, 1],
              }),
            },
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.outerRing}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={30} color={mono.ink} />
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
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#D7D7D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    backgroundColor: 'rgba(231, 231, 229, 0.4)',
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: mono.paper,
    borderWidth: 1.5,
    borderColor: mono.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    textAlign: 'center',
    fontWeight: '800',
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
