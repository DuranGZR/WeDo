import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Controller } from 'react-hook-form';

import { AuthShell, authColors } from '@/components/auth/AuthShell';
import { AppText, TextField } from '@/components/ui';
import { spacing } from '@/design-system';
import { getAuthSubmitError } from '@/features/auth/error-message';
import { PasswordField } from '@/features/auth/PasswordField';
import { useSignInForm } from '@/features/auth/forms';
import { useAuthStore } from '@/store/auth-store';

export default function SignInScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const { inviteToken, email: registeredEmail } = useLocalSearchParams<{
    inviteToken?: string;
    email?: string;
  }>();
  const form = useSignInForm();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (registeredEmail)
      form.setValue('email', registeredEmail, { shouldValidate: true });
  }, [form, registeredEmail]);

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
      subtitle="Ortak planlarına kaldığın yerden güvenle devam et."
      footer={
        <AppText style={styles.footerText}>
          Hesabın yok mu?{' '}
          <Link href="/(auth)/sign-up" style={styles.footerLink}>
            Kayıt ol
          </Link>
        </AppText>
      }
    >
      <View style={styles.form}>
        {registeredEmail ? (
          <View style={styles.registrationNotice}>
            <Ionicons name="checkmark-circle" size={18} color="#47734B" />
            <AppText style={styles.registrationNoticeText}>
              Hesabın oluşturuldu. Şifrenle giriş yap.
            </AppText>
          </View>
        ) : null}
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="E-posta"
              autoCapitalize="none"
              autoCorrect={false}
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
            <PasswordField
              label="Şifre"
              autoComplete="password"
              textContentType="password"
              placeholder="Şifren"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              style={styles.input}
              onSubmitEditing={() => void form.handleSubmit(submit)()}
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
        <AppText muted style={styles.securityHint}>
          E-posta doğrulama ve şifre sıfırlama, güvenli kod sistemiyle yakında eklenecek.
        </AppText>
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
  registrationNotice: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#89A98C',
    backgroundColor: '#EFF7EF',
  },
  registrationNoticeText: {
    flex: 1,
    color: '#29522E',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
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
  securityHint: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: spacing.md,
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
