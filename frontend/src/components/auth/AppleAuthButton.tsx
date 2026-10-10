import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useToast } from '@/components/feedback/AppToast';
import { AppText } from '@/components/ui';
import { authColors } from '@/components/auth/AuthShell';
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
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const signInWithApple = useAuthStore((state) => state.signInWithApple);
  const { showToast } = useToast();

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then(setIsAvailable)
        .catch(() => setIsAvailable(false));
    }
  }, []);

  const handleAppleAuth = async () => {
    setLoading(true);
    try {
      if (Platform.OS !== 'ios' || !isAvailable) {
        showToast({
          title: 'Apple ile Giriş',
          message: 'Apple ile giriş iOS cihazlarda yerel Face ID / Touch ID ile çalışır.',
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
        throw new Error('Apple kimlik belirteci alınamadı.');
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
        title: 'Giriş Başarısız',
        message: err.message ?? 'Apple ile oturum açılırken bir hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator color={authColors.paper} />
      </View>
    );
  }

  // Native Apple Authentication button on supported iOS devices
  if (Platform.OS === 'ios' && isAvailable) {
    return (
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={buttonType}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={12}
        style={[styles.button, style]}
        onPress={() => void handleAppleAuth()}
      />
    );
  }

  // Cross-platform fallback button (Web, Android, Simulator)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Apple ile devam et"
      onPress={() => void handleAppleAuth()}
      style={({ pressed }) => [
        styles.customButton,
        style,
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={require('../../../assets/auth_apple.png')}
        style={styles.iconImage}
        resizeMode="contain"
      />
      <AppText style={styles.customButtonText}>Apple ile Devam Et</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
  },
  customButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#090909',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  customButtonText: {
    color: '#FFFFFF',
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
    height: 48,
    borderRadius: 12,
    backgroundColor: '#090909',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
