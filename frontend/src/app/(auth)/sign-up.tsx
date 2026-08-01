import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import { AuthShell, authColors } from '@/components/auth/AuthShell';
import { ApiClientError } from '@/api/client/api-client';
import { AppText, TextField } from '@/components/ui';
import { spacing } from '@/design-system';
import { useSignUpForm } from '@/features/auth/forms';
import { getAuthSubmitError } from '@/features/auth/error-message';
import { useAuthStore } from '@/store/auth-store';

export default function SignUpScreen() {
  const signUp = useAuthStore((state) => state.signUp);
  const { inviteToken } = useLocalSearchParams<{ inviteToken?: string }>();
  const form = useSignUpForm();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(values: {
    displayName: string;
    email: string;
    password: string;
  }) {
    setSubmitError(null);
    setLoading(true);
    try {
      await signUp(values.email.trim(), values.password, values.displayName.trim());
      router.replace(inviteToken ? `/invite/${inviteToken}` : '/(tabs)');
    } catch (error) {
      const message = getAuthSubmitError(error, 'sign-up');
      setSubmitError(message);
      if (error instanceof ApiClientError && error.status === 409) {
        form.setError('email', { message: 'Bu e-posta adresiyle zaten bir hesap var.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="WeDo'ya katıl"
      subtitle="Birlikte yapmak istediklerinizi tek yerde toplayın."
      footer={
        <AppText style={styles.footerText}>
          Zaten hesabın var mı?{' '}
          <Link href="/(auth)/sign-in" style={styles.footerLink}>
            Giriş yap
          </Link>
        </AppText>
      }
    >
      <View style={styles.form}>
        <Controller
          control={form.control}
          name="displayName"
          render={({ field, fieldState }) => (
            <TextField
              label="Ad"
              placeholder="Adın"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              style={styles.input}
            />
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="E-posta"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="ornek@email.com"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              style={styles.input}
            />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label="Şifre"
              placeholder="En az 8 karakter"
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              style={styles.input}
            />
          )}
        />

        {submitError ? (
          <View accessibilityRole="alert" style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#9D1F1F" />
            <AppText style={styles.errorText}>{submitError}</AppText>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hesap oluştur"
          onPress={() => void form.handleSubmit(submit)()}
          disabled={loading}
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || loading) && styles.pressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={authColors.paper} />
          ) : (
            <>
              <AppText style={styles.primaryButtonText}>Hesap oluştur</AppText>
              <Ionicons name="arrow-forward" size={18} color={authColors.paper} />
            </>
          )}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <AppText style={styles.dividerText}>veya</AppText>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socials}>
          <Pressable
            onPress={() => Alert.alert('Kayıt', 'Google ile kayıt yakında aktif olacak.')}
            style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
          >
            <Ionicons name="logo-google" size={18} color={authColors.ink} />
            <AppText style={styles.socialButtonText}>Google ile kayıt ol</AppText>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert('Kayıt', 'Apple ile kayıt yakında aktif olacak.')}
            style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
          >
            <Ionicons name="logo-apple" size={18} color={authColors.ink} />
            <AppText style={styles.socialButtonText}>Apple ile kayıt ol</AppText>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  input: {
    borderRadius: 8,
    borderColor: '#8D8D8B',
    backgroundColor: authColors.paper,
    fontSize: 15,
  },
  primaryButton: {
    minHeight: 54,
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: 9,
    backgroundColor: authColors.ink,
  },
  primaryButtonText: { color: authColors.paper, fontSize: 14, fontWeight: '700' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#B8B8B6' },
  dividerText: { color: '#626260', fontSize: 11, fontWeight: '600' },
  socials: { gap: spacing.sm },
  socialButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: authColors.ink,
    borderRadius: 9,
    backgroundColor: authColors.paper,
  },
  socialButtonText: { color: authColors.ink, fontSize: 14, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D67A7A',
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    padding: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: '#7A1414',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  footerText: { color: '#5F5F5D', fontSize: 13, textAlign: 'center' },
  footerLink: { color: authColors.ink, fontWeight: '700' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
