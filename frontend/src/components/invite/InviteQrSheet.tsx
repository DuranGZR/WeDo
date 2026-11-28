import { Ionicons } from '@expo/vector-icons';
import QRCode from 'qrcode';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  SlideInDown,
  SlideOutDown,
  useReducedMotion,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { ENTER_EASING } from '@/components/motion/springs';
import { AppText, Button } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { t } from '@/i18n';

/** Generates an SVG path data string covering all dark modules of a QR matrix. */
export function buildQrSvgPath(url: string): { size: number; path: string } | null {
  try {
    const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const data = qr.modules.data;
    const parts: string[] = [];
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (data[row * size + col]) {
          parts.push('M' + String(col) + ' ' + String(row) + 'h1v1h-1z');
        }
      }
    }
    return { size, path: parts.join('') };
  } catch {
    return null;
  }
}

/** Modal sheet displaying a scannable invitation QR code with 1-tap copy and share. */
export function InviteQrSheet({
  visible,
  inviteUrl,
  onClose,
  onCopy,
  onShare,
}: {
  visible: boolean;
  inviteUrl: string;
  onClose: () => void;
  onCopy: () => void;
  onShare: () => void;
}) {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const matrix = useMemo(
    () => (inviteUrl ? buildQrSvgPath(inviteUrl) : null),
    [inviteUrl],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={
            reducedMotion ? undefined : SlideInDown.duration(220).easing(ENTER_EASING)
          }
          exiting={reducedMotion ? undefined : SlideOutDown.duration(160)}
          style={styles.sheet}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Ionicons name="qr-code-outline" size={20} color="#9E7F60" />
            </View>
            <View style={styles.headerCopy}>
              <AppText variant="sectionTitle">{t('invite.qrTitle')}</AppText>
              <AppText variant="caption" muted>
                {t('invite.qrSubtitle')}
              </AppText>
            </View>
          </View>

          {matrix ? (
            <View style={styles.qrFrame}>
              <Svg
                width={196}
                height={196}
                viewBox={`-2 -2 ${matrix.size + 4} ${matrix.size + 4}`}
              >
                <Path d={matrix.path} fill={colors.primaryText} />
              </Svg>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <SpringPressable
              accessibilityRole="button"
              accessibilityLabel={t('invite.copyLink')}
              pressScale={0.96}
              haptic="selection"
              onPress={onCopy}
              style={styles.pillSecondary}
            >
              <Ionicons name="copy-outline" size={16} color="#5F4932" />
              <AppText style={styles.pillSecondaryText}>{t('invite.copyLink')}</AppText>
            </SpringPressable>
            <SpringPressable
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.shareInviteLink')}
              pressScale={0.96}
              haptic="medium"
              onPress={onShare}
              style={styles.pillPrimary}
            >
              <Ionicons name="share-outline" size={16} color={colors.onAccent} />
              <AppText style={styles.pillPrimaryText}>
                {t('onboarding.shareInviteLink')}
              </AppText>
            </SpringPressable>
          </View>

          <Button label={t('legal.close')} variant="ghost" onPress={onClose} />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 17, 16, 0.36)',
  },
  sheet: {
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: spacing.section,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    ...shadows.elevated,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(17, 17, 16, 0.16)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  qrFrame: {
    alignSelf: 'center',
    padding: spacing.lg,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#D4BEA4',
    ...shadows.card,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pillSecondary: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pillSecondaryText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#5F4932',
  },
  pillPrimary: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...shadows.pillAction,
  },
  pillPrimaryText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.onAccent,
  },
});
