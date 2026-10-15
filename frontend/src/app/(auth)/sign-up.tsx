import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Controller } from 'react-hook-form';

import * as AppleAuthentication from 'expo-apple-authentication';
import { ApiClientError } from '@/api/client/api-client';
import { AppleAuthButton } from '@/components/auth/AppleAuthButton';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { AuthShell, authColors } from '@/components/auth/AuthShell';
import { AppText, TextField } from '@/components/ui';
import { spacing } from '@/design-system';
import { getAuthSubmitError } from '@/features/auth/error-message';
import { PasswordField } from '@/features/auth/PasswordField';
import { useSignUpForm } from '@/features/auth/forms';
import { getPasswordStrength } from '@/features/auth/password-strength';
import { useAuthStore } from '@/store/auth-store';

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={passed ? 'checkmark-circle' : 'ellipse-outline'}
        size={15}
        color={passed ? '#47734B' : '#747472'}
      />
      <AppText style={[styles.checkText, passed && styles.checkTextPassed]}>
        {label}
      </AppText>
    </View>
  );
}

export default function SignUpScreen() {
  const signUp = useAuthStore((state) => state.signUp);
  const { inviteToken } = useLocalSearchParams<{ inviteToken?: string }>();
  const form = useSignUpForm();
  const password = form.watch('password');
  const strength = getPasswordStrength(password);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(values: {
    displayName: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }) {
    setSubmitError(null);
    setLoading(true);
    try {
      const email = values.email.trim().toLowerCase();
      const challenge = await signUp(email, values.password, values.displayName.trim());
      router.replace({
        pathname: '/(auth)/verify-email',
        params: {
          email,
          verificationId: challenge.verification_id,
          resendAfter: String(challenge.resend_after_seconds),
          ...(inviteToken ? { inviteToken } : {}),
        },
      });
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
      subtitle="Önce hesabını oluştur, sonra güvenli şekilde giriş yap."
      footer={
        <AppText style={styles.footerText}>
          Zaten hesabın var mı?{' '}
          <Link
            href={
              inviteToken
                ? (`/(auth)/sign-in?inviteToken=${encodeURIComponent(inviteToken)}` as any)
                : '/(auth)/sign-in'
            }
            style={styles.footerLink}
          >
            Giriş yap
          </Link>
        </AppText>
      }
    >
      <View style={styles.form}>
        <AppleAuthButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
          inviteToken={inviteToken}
        />
        <GoogleAuthButton inviteToken={inviteToken} style={{ marginTop: 10 }} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <AppText muted style={styles.dividerText}>
            veya e-posta ile
          </AppText>
          <View style={styles.dividerLine} />
        </View>

        <Controller
          control={form.control}
          name="displayName"
          render={({ field, fieldState }) => (
            <TextField
              label="Ad"
              placeholder="Adın"
              autoCapitalize="words"
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
              placeholder="Güçlü bir şifre oluştur"
              autoComplete="new-password"
              textContentType="newPassword"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              style={styles.input}
            />
          )}
        />
        <View style={styles.strengthCard}>
          <View style={styles.strengthHeader}>
            <AppText style={styles.strengthTitle}>Şifre gücü</AppText>
            <AppText
              style={[
                styles.strengthLabel,
                strength.score === 4 && styles.strengthLabelGood,
              ]}
            >
              {strength.label}
            </AppText>
          </View>
          <View style={styles.strengthBars}>
            {[1, 2, 3, 4].map((index) => (
              <View
                key={index}
                style={[
                  styles.strengthBar,
                  strength.score >= index && styles.strengthBarActive,
                ]}
              />
            ))}
          </View>
          <View style={styles.checks}>
            <PasswordCheck passed={strength.checks.length} label="En az 8 karakter" />
            <PasswordCheck passed={strength.checks.uppercase} label="Bir büyük harf" />
            <PasswordCheck passed={strength.checks.lowercase} label="Bir küçük harf" />
            <PasswordCheck passed={strength.checks.digit} label="Bir rakam" />
          </View>
        </View>
        <Controller
          control={form.control}
          name="passwordConfirmation"
          render={({ field, fieldState }) => (
            <PasswordField
              label="Şifre tekrar"
              placeholder="Şifreni tekrar gir"
              autoComplete="new-password"
              textContentType="newPassword"
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

        <View style={styles.legalNotice}>
          <AppText muted style={styles.legalText}>
            Hesap oluşturarak{' '}
            <AppText
              style={styles.legalLink}
              onPress={() => router.push('/legal/terms' as never)}
            >
              Kullanım Koşulları
            </AppText>{' '}
            ve{' '}
            <AppText
              style={styles.legalLink}
              onPress={() => router.push('/legal/privacy' as never)}
            >
              Gizlilik Politikası
            </AppText>
            &apos;nı kabul etmiş olursunuz.
          </AppText>
        </View>

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
        <AppText muted style={styles.afterRegister}>
          Hesabı oluşturduktan sonra giriş yapman istenir.
        </AppText>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D1CF',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderRadius: 8,
    borderColor: '#8D8D8B',
    backgroundColor: authColors.paper,
    fontSize: 15,
  },
  strengthCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B8B8B6',
    backgroundColor: '#F3F3F1',
  },
  strengthHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  strengthTitle: { fontSize: 12, fontWeight: '800' },
  strengthLabel: { fontSize: 12, fontWeight: '800', color: '#747472' },
  strengthLabelGood: { color: '#47734B' },
  strengthBars: { flexDirection: 'row', gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#D1D1CF' },
  strengthBarActive: { backgroundColor: authColors.ink },
  checks: { gap: 3 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  checkText: { fontSize: 11, color: '#747472' },
  checkTextPassed: { color: '#47734B', fontWeight: '700' },
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
  afterRegister: { textAlign: 'center', fontSize: 11, lineHeight: 16 },
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
  legalNotice: { marginTop: spacing.xs, alignItems: 'center' },
  legalText: { fontSize: 11, lineHeight: 16, textAlign: 'center', color: '#6F6F6D' },
  legalLink: { color: authColors.ink, fontWeight: '600' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
