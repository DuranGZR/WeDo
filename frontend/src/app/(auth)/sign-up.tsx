import { t } from '@/i18n';
import { useTranslation, Trans } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Controller } from 'react-hook-form';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import * as AppleAuthentication from 'expo-apple-authentication';
import { ApiClientError } from '@/api/client/api-client';
import { AppleAuthButton } from '@/components/auth/AppleAuthButton';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { AuthShell } from '@/components/auth/AuthShell';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, TextField } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { getAuthSubmitError } from '@/features/auth/error-message';
import { PasswordField } from '@/features/auth/PasswordField';
import { useSignUpForm } from '@/features/auth/forms';
import { getPasswordStrength } from '@/features/auth/password-strength';
import { useAuthStore } from '@/store/auth-store';

function PasswordCheck({
  passed,
  label,
  reducedMotion,
}: {
  passed: boolean;
  label: string;
  reducedMotion: boolean;
}) {
  useTranslation();
  const iconScale = useSharedValue(1);
  const wasPassed = useSharedValue(passed);

  useEffect(() => {
    const becamePassed = passed && !wasPassed.get();
    wasPassed.set(passed);
    if (becamePassed && !reducedMotion) {
      iconScale.set(
        withSequence(
          withSpring(1.24, { damping: 10, stiffness: 360, mass: 0.5 }),
          withSpring(1, { damping: 16, stiffness: 260, mass: 0.7 }),
        ),
      );
    }
  }, [iconScale, passed, reducedMotion, wasPassed]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.get() }],
  }));

  return (
    <View style={styles.checkRow}>
      <Animated.View style={iconStyle}>
        <Ionicons
          name={passed ? 'checkmark-circle' : 'ellipse-outline'}
          size={15}
          color={passed ? colors.success : colors.tertiaryText}
        />
      </Animated.View>
      <AppText style={[styles.checkText, passed && styles.checkTextPassed]}>
        {label}
      </AppText>
    </View>
  );
}

function StrengthBar({
  active,
  strong,
  reducedMotion,
}: {
  active: boolean;
  strong: boolean;
  reducedMotion: boolean;
}) {
  const fillScale = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    const target = active ? 1 : 0;
    if (reducedMotion) {
      fillScale.set(target);
    } else {
      fillScale.set(withSpring(target, { damping: 18, stiffness: 260, mass: 0.75 }));
    }
  }, [active, fillScale, reducedMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fillScale.get() }],
    opacity: 0.25 + 0.75 * fillScale.get(),
  }));

  return (
    <View style={styles.strengthBarTrack}>
      <Animated.View
        style={[styles.strengthBarFill, strong && styles.strengthBarStrong, fillStyle]}
      />
    </View>
  );
}

export default function SignUpScreen() {
  const { i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const signUp = useAuthStore((state) => state.signUp);
  const { inviteToken } = useLocalSearchParams<{ inviteToken?: string }>();
  const form = useSignUpForm();
  const password = form.watch('password');
  const strength = getPasswordStrength(password);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const showStrengthCard = passwordFocused || password.length > 0;
  const collapseChecklist = !passwordFocused && strength.score === 4;

  useEffect(() => {
    const clearFeedback = () => {
      setSubmitError(null);
    };
    i18n.on('languageChanged', clearFeedback);
    return () => {
      i18n.off('languageChanged', clearFeedback);
    };
  }, [i18n]);

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
        form.setError('email', {
          message: t('auth.anAccountWithThisEmailAlreadyExists'),
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t('auth.joinWedo')}
      subtitle={t('auth.createYourAccountThenVerifyYourEmailToGetStarted')}
      footer={
        <AppText style={styles.footerText}>
          {t('auth.alreadyHaveAnAccount')}{' '}
          <Link
            href={
              inviteToken
                ? (`/(auth)/sign-in?inviteToken=${encodeURIComponent(inviteToken)}` as any)
                : '/(auth)/sign-in'
            }
            style={styles.footerLink}
          >
            {t('common.signIn')}
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
            {t('auth.orUseYourEmail')}
          </AppText>
          <View style={styles.dividerLine} />
        </View>

        <Controller
          control={form.control}
          name="displayName"
          render={({ field, fieldState }) => (
            <TextField
              label={t('auth.name')}
              placeholder={t('auth.yourName')}
              autoCapitalize="words"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
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
              placeholder={t('auth.createAStrongPassword')}
              autoComplete="new-password"
              textContentType="newPassword"
              value={field.value}
              onChangeText={field.onChange}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              error={fieldState.error?.message}
            />
          )}
        />
        {showStrengthCard ? (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(200)}
            exiting={reducedMotion ? undefined : FadeOutUp.duration(150)}
            layout={reducedMotion ? undefined : LAYOUT_SPRING}
            style={[styles.strengthCard, collapseChecklist && styles.strengthCardCompact]}
          >
            <View style={styles.strengthHeader}>
              <AppText style={styles.strengthTitle}>{t('auth.passwordStrength')}</AppText>
              <View style={styles.strengthStatusWrap}>
                {strength.score === 4 ? (
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                ) : null}
                <AppText
                  style={[
                    styles.strengthLabel,
                    strength.score === 4 && styles.strengthLabelGood,
                  ]}
                >
                  {strength.label}
                </AppText>
              </View>
            </View>
            <View style={styles.strengthBars}>
              {[1, 2, 3, 4].map((index) => (
                <StrengthBar
                  key={index}
                  active={strength.score >= index}
                  strong={strength.score === 4}
                  reducedMotion={reducedMotion}
                />
              ))}
            </View>
            {!collapseChecklist ? (
              <Animated.View
                entering={reducedMotion ? undefined : FadeInDown.duration(180)}
                style={styles.checks}
              >
                <PasswordCheck
                  passed={strength.checks.length}
                  label={t('auth.atLeast8Characters')}
                  reducedMotion={reducedMotion}
                />
                <PasswordCheck
                  passed={strength.checks.uppercase}
                  label={t('auth.anUppercaseLetter')}
                  reducedMotion={reducedMotion}
                />
                <PasswordCheck
                  passed={strength.checks.lowercase}
                  label={t('auth.aLowercaseLetter')}
                  reducedMotion={reducedMotion}
                />
                <PasswordCheck
                  passed={strength.checks.digit}
                  label={t('auth.aNumber')}
                  reducedMotion={reducedMotion}
                />
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}
        <Controller
          control={form.control}
          name="passwordConfirmation"
          render={({ field, fieldState }) => (
            <PasswordField
              label={t('auth.confirmPassword')}
              placeholder={t('auth.enterYourPasswordAgain')}
              autoComplete="new-password"
              textContentType="newPassword"
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

        <View style={styles.legalNotice}>
          <AppText muted style={styles.legalText}>
            <Trans
              i18nKey="auth.registrationAgreement"
              components={{
                terms: (
                  <AppText
                    style={styles.legalLink}
                    onPress={() => router.push('/legal/terms' as never)}
                  />
                ),
                privacy: (
                  <AppText
                    style={styles.legalLink}
                    onPress={() => router.push('/legal/privacy' as never)}
                  />
                ),
              }}
            />
          </AppText>
        </View>

        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('auth.createAccount')}
          haptic="medium"
          onPress={() => void form.handleSubmit(submit)()}
          disabled={loading}
          style={[styles.primaryButton, loading && styles.disabledButton]}
        >
          {loading ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <>
              <AppText style={styles.primaryButtonText}>
                {t('auth.createAccount')}
              </AppText>
              <Ionicons name="arrow-forward" size={18} color={colors.onAccent} />
            </>
          )}
        </SpringPressable>
        <AppText muted style={styles.afterRegister}>
          {t('auth.weLlEmailYouAVerificationCodeAfterYouSign')}
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
    backgroundColor: 'rgba(17, 17, 16, 0.1)',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  strengthCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F5F2EC',
  },
  strengthCardCompact: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.successSoft,
    borderColor: 'rgba(78, 122, 88, 0.22)',
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthStatusWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  strengthTitle: { fontSize: 12, fontWeight: '700' },
  strengthLabel: { fontSize: 12, fontWeight: '700', color: colors.secondaryText },
  strengthLabelGood: { color: colors.success },
  strengthBars: { flexDirection: 'row', gap: 4 },
  strengthBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(17, 17, 16, 0.10)',
  },
  strengthBarFill: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  strengthBarStrong: {
    backgroundColor: colors.success,
  },
  checks: { gap: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  checkText: { fontSize: 11, color: colors.secondaryText },
  checkTextPassed: { color: colors.success, fontWeight: '700' },
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
  afterRegister: { textAlign: 'center', fontSize: 11, lineHeight: 16 },
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
  legalNotice: { marginTop: spacing.xs, alignItems: 'center' },
  legalText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    color: colors.secondaryText,
  },
  legalLink: {
    color: colors.primaryText,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});
