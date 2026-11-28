import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useToast } from '@/components/feedback/AppToast';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText } from '@/components/ui';
import { colors, radius, shadows } from '@/design-system';
import { getGoogleIdToken } from '@/lib/google-auth';
import { useAuthStore } from '@/store/auth-store';

type GoogleAuthButtonProps = {
  inviteToken?: string;
  style?: StyleProp<ViewStyle>;
  onSuccess?: () => void;
};

export function GoogleAuthButton({
  inviteToken,
  style,
  onSuccess,
}: GoogleAuthButtonProps) {
  useTranslation();
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const { showToast } = useToast();

  const handleGoogleAuth = async () => {
    if (Platform.OS === 'web') {
      showToast({
        title: t('auth.continueWithGoogle'),
        message: t('auth.socialSignInInIphoneApp'),
        type: 'info',
      });
      return;
    }
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) return;
      await signInWithGoogle(idToken);

      if (onSuccess) {
        onSuccess();
      } else {
        router.replace(inviteToken ? `/invite/${inviteToken}` : '/(tabs)');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      showToast({
        type: 'error',
        title: t('auth.signInFailed'),
        message: err.message ?? t('auth.somethingWentWrongSigningInWithGoogle'),
      });
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  if (Platform.OS !== 'ios' && Platform.OS !== 'web') return null;

  if (loading) {
    return (
      <View style={[styles.button, styles.loadingContainer, style]}>
        <ActivityIndicator color={colors.primaryText} />
      </View>
    );
  }

  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityLabel={t('auth.continueWithGoogle')}
      pressScale={0.97}
      pressOpacity={0.88}
      haptic="light"
      onPress={() => void handleGoogleAuth()}
      style={[styles.button, style]}
    >
      <Image
        source={require('../../../assets/auth_google.png')}
        style={styles.iconImage}
        resizeMode="contain"
      />
      <AppText style={styles.buttonText}>{t('auth.continueWithGoogle_99694')}</AppText>
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 10,
    ...shadows.glass,
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  iconImage: {
    width: 19,
    height: 19,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
