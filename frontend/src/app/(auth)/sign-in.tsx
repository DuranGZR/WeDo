import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Controller } from 'react-hook-form';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { AppleAuthButton } from '@/components/auth/AppleAuthButton';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { AuthShell } from '@/components/auth/AuthShell';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, TextField } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { getAuthSubmitError } from '@/features/auth/error-message';
import { getVerificationChallenge } from '@/features/auth/email-verification';
import { PasswordField } from '@/features/auth/PasswordField';
import { useSignInForm } from '@/features/auth/forms';
import { useAuthStore } from '@/store/auth-store';

export default function SignInScreen() {
  const { i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
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

  useEffect(() => {
    const clearFeedback = () => {
      setSubmitError(null);
    };
    i18n.on('languageChanged', clearFeedback);
    return () => {
      i18n.off('languageChanged', clearFeedback);
    };
  }, [i18n]);

  async function submit(values: { email: string; password: string }) {
    setSubmitError(null);
    setLoading(true);
    try {
      await signIn(values.email.trim(), values.password);
      router.replace(inviteToken ? `/invite/${inviteToken}` : '/(tabs)');
    } catch (error) {
      const challenge = getVerificationChallenge(error);
      if (challenge) {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: {
            verificationId: challenge.verification_id,
            email: challenge.email,
            resendAfter: String(challenge.resend_after_seconds),
            ...(inviteToken ? { inviteToken } : {}),
          },
        });
        return;
      }
      setSubmitError(getAuthSubmitError(error, 'sign-in'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t('auth.welcomeBack')}
      subtitle={t('auth.pickUpWhereYouLeftOffWithYourSharedPlans')}
      belowCard={
        <AppText muted style={styles.securityHint}>
          {t('auth.verifyYourEmailToSignInSecurely')}
        </AppText>
      }
      footer={
        <AppText style={styles.footerText}>
          {t('auth.newToWedo')}{' '}
          <Link
            href={
              inviteToken
                ? (`/(auth)/sign-up?inviteToken=${encodeURIComponent(inviteToken)}` as any)
                : '/(auth)/sign-up'
            }
            style={styles.footerLink}
          >
            {t('auth.signUp')}
          </Link>
        </AppText>
      }
    >
      <View style={styles.form}>
        <AppleAuthButton inviteToken={inviteToken} />
        <GoogleAuthButton inviteToken={inviteToken} style={{ marginTop: 10 }} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <AppText muted style={styles.dividerText}>
            {t('auth.orUseYourEmail')}
          </AppText>
          <View style={styles.dividerLine} />
        </View>

        {registeredEmail ? (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(200)}
            layout={reducedMotion ? undefined : LAYOUT_SPRING}
            style={styles.registrationNotice}
          >
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <AppText style={styles.registrationNoticeText}>
              {t('auth.onceYourEmailIsVerifiedSignInWithYourPassword')}
            </AppText>
          </Animated.View>
        ) : null}
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label={t('auth.email')}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              placeholder={t('auth.youExampleCom')}
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <PasswordField
              label={t('common.password')}
              autoComplete="password"
              textContentType="password"
              placeholder={t('auth.yourPassword')}
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              onSubmitEditing={() => void form.handleSubmit(submit)()}
            />
          )}
        />
        {submitError ? (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(180)}
            layout={reducedMotion ? undefined : LAYOUT_SPRING}
            accessibilityRole="alert"
            style={styles.errorBanner}
          >
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <AppText style={styles.errorText}>{submitError}</AppText>
          </Animated.View>
        ) : null}
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('common.signIn')}
          haptic="medium"
          onPress={() => void form.handleSubmit(submit)()}
          disabled={loading}
          style={[styles.primaryButton, loading && styles.disabledButton]}
        >
          {loading ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <>
              <AppText style={styles.primaryButtonText}>{t('common.signIn')}</AppText>
              <Ionicons name="arrow-forward" size={18} color={colors.onAccent} />
            </>
          )}
        </SpringPressable>
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
    backgroundColor: 'rgba(17, 17, 16, 0.1)',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  registrationNotice: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 122, 88, 0.28)',
    backgroundColor: colors.successSoft,
  },
  registrationNoticeText: {
    flex: 1,
    color: colors.success,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 52,
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    ...shadows.pillAction,
  },
  disabledButton: { opacity: 0.72 },
  primaryButtonText: { color: colors.onAccent, fontSize: 15, fontWeight: '700' },
  securityHint: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184, 74, 66, 0.28)',
    backgroundColor: colors.errorSoft,
    borderRadius: 16,
    padding: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  footerText: { color: colors.secondaryText, fontSize: 13, textAlign: 'center' },
  footerLink: { color: colors.primaryText, fontWeight: '700' },
});
