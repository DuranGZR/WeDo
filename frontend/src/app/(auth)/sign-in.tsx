import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import { AuthShell, authColors } from '@/components/auth/AuthShell';
import { AppText, TextField } from '@/components/ui';
import { spacing } from '@/design-system';
import { useSignInForm } from '@/features/auth/forms';
import { getAuthSubmitError } from '@/features/auth/error-message';
import { useAuthStore } from '@/store/auth-store';

export default function SignInScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const { inviteToken } = useLocalSearchParams<{ inviteToken?: string }>();
  const form = useSignInForm();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(values: { email: string; password: string }) {
    setSubmitError(null);
    setLoading(true);
    try {
      await signIn(values.email.trim(), values.password);
      router.replace(inviteToken ? `/invite/${inviteToken}` : '/(tabs)');
    } catch (error) {
      setSubmitError(getAuthSubmitError(error, 'sign-in'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Tekrar hoş geldin"
      subtitle="Ortak planlarına kaldığın yerden devam et."
      footer={
        <AppText style={styles.footerText}>
          Hesabın yok mu?{' '}
          <Link
            href={
              inviteToken
                ? `/(auth)/sign-up?inviteToken=${inviteToken}`
                : '/(auth)/sign-up'
            }
            style={styles.footerLink}
          >
            Kayıt ol
          </Link>
        </AppText>
      }
    >
      <View style={styles.form}>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="E-posta"
              autoCapitalize="none"
              autoComplete="email"
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
              autoComplete="password"
              placeholder="Şifren"
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
          accessibilityLabel="Giriş yap"
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
              <AppText style={styles.primaryButtonText}>Giriş yap</AppText>
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
            onPress={() => Alert.alert('Giriş', 'Google ile giriş yakında aktif olacak.')}
            style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
          >
            <Ionicons name="logo-google" size={18} color={authColors.ink} />
            <AppText style={styles.socialButtonText}>Google ile giriş</AppText>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert('Giriş', 'Apple ile giriş yakında aktif olacak.')}
            style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
          >
            <Ionicons name="logo-apple" size={18} color={authColors.ink} />
            <AppText style={styles.socialButtonText}>Apple ile giriş</AppText>
          </Pressable>
        </View>

        <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
          Şifremi unuttum
        </Link>
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
  forgotLink: {
    marginTop: spacing.xs,
    color: authColors.ink,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
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
