import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { SHEET_SPRING } from '@/components/motion/springs';
import { AppText } from '@/components/ui';
import { colors, radius, shadows } from '@/design-system';
import { haptic } from '@/lib/haptics';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastInput = {
  title: string;
  message?: string;
  type?: ToastType;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastContextValue = { showToast: (toast: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastIconConfig(type: ToastType = 'success') {
  switch (type) {
    case 'error':
      return {
        icon: 'alert-circle' as const,
        iconColor: colors.onAccent,
        wrapBg: colors.error,
      };
    case 'warning':
      return {
        icon: 'cloud-offline-outline' as const,
        iconColor: colors.primaryText,
        wrapBg: colors.warning,
      };
    case 'info':
      return {
        icon: 'information' as const,
        iconColor: colors.primaryText,
        wrapBg: colors.surfaceSecondary,
      };
    case 'success':
    default:
      return {
        icon: 'checkmark' as const,
        iconColor: colors.primaryText,
        wrapBg: colors.surface,
      };
  }
}

function ToastViewport({
  toast,
  onDismiss,
}: {
  toast: ToastInput | null;
  onDismiss: () => void;
}) {
  useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!toast) {
      progress.set(0);
      return;
    }
    if (reducedMotion) {
      progress.set(1);
      return;
    }
    cancelAnimation(progress);
    progress.set(0);
    progress.set(withSpring(1, SHEET_SPRING));
  }, [progress, reducedMotion, toast]);

  const viewportAnimStyle = useAnimatedStyle(() => {
    const val = progress.get();
    return {
      opacity: val,
      transform: [{ translateY: (1 - val) * 28 }],
    };
  });

  if (!toast) return null;

  const iconConfig = getToastIconConfig(toast.type);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.viewport, { bottom: insets.bottom + 92 }, viewportAnimStyle]}
    >
      <View accessibilityLiveRegion="polite" style={styles.toast}>
        <View style={[styles.iconWrap, { backgroundColor: iconConfig.wrapBg }]}>
          <Ionicons name={iconConfig.icon} size={17} color={iconConfig.iconColor} />
        </View>
        <View style={styles.copy}>
          <AppText style={styles.title}>{toast.title}</AppText>
          {toast.message ? (
            <AppText style={styles.message} numberOfLines={2}>
              {toast.message}
            </AppText>
          ) : null}
        </View>
        <View style={styles.actions}>
          {toast.actionLabel && toast.onAction ? (
            <SpringPressable
              accessibilityRole="button"
              accessibilityLabel={toast.actionLabel}
              pressScale={0.95}
              haptic="light"
              onPress={() => {
                toast.onAction?.();
                onDismiss();
              }}
              style={styles.actionButton}
            >
              <AppText style={styles.actionText}>{toast.actionLabel}</AppText>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </SpringPressable>
          ) : null}
          <SpringPressable
            accessibilityRole="button"
            accessibilityLabel={t('common.dismissNotification')}
            pressScale={0.9}
            haptic="light"
            onPress={onDismiss}
            hitSlop={8}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </SpringPressable>
        </View>
      </View>
    </Animated.View>
  );
}

export function ToastProvider({ children }: PropsWithChildren) {
  const { i18n } = useTranslation();
  const [toast, setToast] = useState<ToastInput | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = null;
    setToast(null);
  }, []);

  useEffect(() => {
    i18n.on('languageChanged', dismissToast);
    return () => {
      i18n.off('languageChanged', dismissToast);
    };
  }, [dismissToast, i18n]);

  const showToast = useCallback(
    (nextToast: ToastInput) => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      const type = nextToast.type ?? 'success';
      if (type === 'success') haptic.success();
      else if (type === 'error') haptic.error();
      else if (type === 'warning') haptic.warning();
      else haptic.light();

      setToast(nextToast);
      dismissTimer.current = setTimeout(dismissToast, 4_500);
    },
    [dismissToast],
  );

  useEffect(
    () => () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider.');
  return context;
}

/** Optional toast hook for standalone views or tests without ToastProvider. */
export function useOptionalToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  viewport: { position: 'absolute', left: 16, right: 16, zIndex: 100 },
  toast: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: colors.accent,
    ...shadows.elevated,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  copy: { flex: 1, gap: 2 },
  title: { color: colors.onAccent, fontSize: 14, fontWeight: '700' },
  message: { color: '#DAD5CD', fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  actionText: { color: colors.onAccent, fontSize: 11, fontWeight: '700' },
  closeButton: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
});
