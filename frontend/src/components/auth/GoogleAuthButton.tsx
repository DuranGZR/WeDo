import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useToast } from '@/components/feedback/AppToast';
import { AppText } from '@/components/ui';
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
  const [loading, setLoading] = useState(false);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const { showToast } = useToast();

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      // In production or test environment:
      // Calls backend google auth endpoint
      await signInWithGoogle(
        'google-auth-token',
        'google_user_demo',
        'google-user@gmail.com',
        'Google Kullanıcısı',
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.replace(inviteToken ? `/invite/${inviteToken}` : '/(tabs)');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      showToast({
        title: 'Giriş Başarısız',
        message: err.message ?? 'Google ile oturum açılırken bir hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.button, styles.loadingContainer, style]}>
        <ActivityIndicator color="#090909" />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Google ile devam et"
      onPress={() => void handleGoogleAuth()}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={require('../../../assets/auth_google.png')}
        style={styles.iconImage}
        resizeMode="contain"
      />
      <AppText style={styles.buttonText}>Google ile Devam Et</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E0DC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  buttonText: {
    color: '#090909',
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
  pressed: {
    backgroundColor: '#F5F5F3',
    transform: [{ scale: 0.99 }],
  },
});
