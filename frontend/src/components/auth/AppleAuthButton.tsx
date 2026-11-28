import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { useAuthStore } from '@/store/auth-store';

type AppleAuthButtonProps = {
  buttonType?: AppleAuthentication.AppleAuthenticationButtonType;
  inviteToken?: string;
  style?: StyleProp<ViewStyle>;
  onSuccess?: () => void;
};

export function AppleAuthButton({
  buttonType = AppleAuthentication.AppleAuthenticationButtonType.CONTINUE,
  inviteToken,
  style,
  onSuccess,
}: AppleAuthButtonProps) {
  useTranslation();
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const signInWithApple = useAuthStore((state) => state.signInWithApple);
  const { showToast } = useToast();
  const label =
    buttonType === AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
      ? t('auth.signUpWithApple')
      : buttonType === AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
        ? t('auth.signInWithApple')
        : t('auth.continueWithApple');

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then(setIsAvailable)
        .catch(() => setIsAvailable(false));
    }
  }, []);

  const handleAppleAuth = async () => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    try {
      if (Platform.OS !== 'ios' || !isAvailable) {
        showToast({
          type: 'info',
          title: t('auth.signInWithApple'),
          message: t('auth.signInWithAppleIsAvailableOnSupportedIosDevices'),
        });
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error(t('auth.weCouldnTGetYourAppleIdentityToken'));
      }
      if (!credential.authorizationCode) {
        throw new Error(t('auth.somethingWentWrongSigningInWithApple'));
      }

      const fullName = credential.fullName;
      const displayName = [fullName?.givenName, fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim();

      await signInWithApple(
        credential.identityToken,
        credential.user,
        credential.email ?? undefined,
        displayName.length > 0 ? displayName : undefined,
        credential.authorizationCode ?? undefined,
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.replace(inviteToken ? `/invite/${inviteToken}` : '/(tabs)');
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      showToast({
        type: 'error',
        title: t('auth.signInFailed'),
        message: err.message ?? t('auth.somethingWentWrongSigningInWithApple'),
      });
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  // Render our localized label; the native button follows the device language.
  // Authentication still uses Apple's native authorization sheet.
  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={Platform.OS === 'ios' && !isAvailable}
      pressScale={0.97}
      pressOpacity={0.86}
      haptic="light"
      onPress={() => void handleAppleAuth()}
      style={[styles.customButton, style]}
    >
      <Image
        source={require('../../../assets/auth_apple.png')}
        style={styles.iconImage}
        resizeMode="contain"
      />
      <AppText style={styles.customButtonText}>{label}</AppText>
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  customButton: {
    width: '100%',
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 10,
    ...shadows.pillAction,
  },
  customButtonText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  iconImage: {
    width: 17,
    height: 21,
    marginBottom: 2,
  },
  loadingContainer: {
    width: '100%',
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
