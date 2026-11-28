import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/design-system';
import { t } from '@/i18n';
import { IconButton } from './IconButton';

export function ScreenHeader({
  onBack,
  fallbackHref = '/(tabs)',
  backLabel,
  backIcon = 'arrow-back',
  rightAction,
}: {
  onBack?: () => void;
  fallbackHref?: Href;
  backLabel?: string;
  backIcon?: keyof typeof Ionicons.glyphMap;
  rightAction?: ReactNode;
}) {
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  };

  return (
    <View style={styles.headerBar}>
      <IconButton
        tone="glass"
        size={42}
        label={backLabel ?? t('common.goBack')}
        icon={<Ionicons name={backIcon} size={20} color={colors.primaryText} />}
        onPress={handleBack}
      />
      {rightAction}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: Platform.OS === 'ios' ? 0 : spacing.xs,
  },
});
