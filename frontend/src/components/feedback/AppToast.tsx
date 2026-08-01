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
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';

type ToastInput = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastContextValue = { showToast: (toast: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastViewport({ toast, onDismiss }: { toast: ToastInput | null; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      speed: 18,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  }, [progress, toast]);

  if (!toast) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.viewport,
        {
          bottom: insets.bottom + 86,
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
          ],
        },
      ]}
    >
      <View accessibilityLiveRegion="polite" style={styles.toast}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark" size={17} color="#090909" />
        </View>
        <View style={styles.copy}>
          <AppText style={styles.title}>{toast.title}</AppText>
          <AppText style={styles.message} numberOfLines={2}>
            {toast.message}
          </AppText>
        </View>
        <View style={styles.actions}>
          {toast.actionLabel && toast.onAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={toast.actionLabel}
              onPress={() => {
                toast.onAction?.();
                onDismiss();
              }}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <AppText style={styles.actionText}>{toast.actionLabel}</AppText>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bildirimi kapat"
            onPress={onDismiss}
            hitSlop={8}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastInput | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = null;
    setToast(null);
  }, []);

  const showToast = useCallback(
    (nextToast: ToastInput) => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
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

const styles = StyleSheet.create({
  viewport: { position: 'absolute', left: 16, right: 16, zIndex: 100 },
  toast: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#090909',
    backgroundColor: '#090909',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  copy: { flex: 1, gap: 2 },
  title: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  message: { color: '#D7D7D5', fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: '#262625',
  },
  actionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  closeButton: { width: 30, height: 36, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});
