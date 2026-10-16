import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AuthShell, authColors } from '@/components/auth/AuthShell';
import { AppText, TextField } from '@/components/ui';
import { spacing } from '@/design-system';
import { resendVerification, verifyEmail } from '@/features/auth/email-verification';

export default function VerifyEmailScreen() {
  const { i18n } = useTranslation();
  const { email, verificationId, resendAfter, inviteToken } = useLocalSearchParams<{
    email?: string;
    verificationId?: string;
    resendAfter?: string;
    inviteToken?: string;
  }>();
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.min(60, Number(resendAfter) || 0)),
  );
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const timer = setInterval(
      () => setRemaining((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  function goToSignIn() {
    router.replace({
      pathname: '/(auth)/sign-in',
      params: {
        ...(email ? { email } : {}),
        ...(inviteToken ? { inviteToken } : {}),
      },
    });
  }

  useEffect(() => {
    const clearFeedback = () => {
      setError(null);
      setNotice(null);
    };
    i18n.on('languageChanged', clearFeedback);
    return () => {
      i18n.off('languageChanged', clearFeedback);
    };
  }, [i18n]);

  async function submit(resend: boolean) {
    if (pending.current || !verificationId || (resend && remaining > 0)) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (resend) {
        const result = await resendVerification(verificationId);
        setRemaining(result.resend_after_seconds);
        setCode('');
        setNotice(t('auth.yourCodeHasBeenSentCheckYourInboxAndSpam'));
      } else {
        await verifyEmail(verificationId, code);
        setVerified(true);
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : t('auth.somethingWentWrongPleaseTryAgain'),
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <AuthShell
      footer={<AppText muted>{t('auth.onlyEnterYourCodeInTheWedoApp')}</AppText>}
      title={verified ? t('auth.emailVerified') : t('auth.verifyYourEmail')}
      subtitle={
        verified
          ? t('auth.youCanNowSignInWithYourEmailAndPassword')
          : t('auth.enterThe6DigitCodeWeSentToValue', {
              value0: email ?? t('common.yourEmail'),
            })
      }
    >
      <View style={styles.form}>
        {verified || !verificationId ? (
          <Pressable
            accessibilityRole="button"
            style={styles.button}
            onPress={goToSignIn}
          >
            <AppText style={styles.buttonText}>{t('common.signIn')}</AppText>
          </Pressable>
        ) : (
          <>
            <TextField
              label={t('auth.verificationCode')}
              value={code}
              maxLength={6}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              autoFocus
              autoCapitalize="none"
              editable={!busy}
              onChangeText={(value) => setCode(value.replace(/[^0-9]/g, ''))}
              onSubmitEditing={() => {
                if (code.length === 6) void submit(false);
              }}
            />
            <AppText muted>{t('auth.yourCodeIsValidFor10MinutesCheckYourSpam')}</AppText>
            {error ? (
              <AppText accessibilityRole="alert" style={styles.error}>
                {error}
              </AppText>
            ) : null}
            {notice ? <AppText accessibilityLiveRegion="polite">{notice}</AppText> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('auth.verifyEmail')}
              disabled={busy || code.length !== 6}
              onPress={() => void submit(false)}
              style={[styles.button, (busy || code.length !== 6) && styles.disabled]}
            >
              {busy ? (
                <ActivityIndicator color={authColors.paper} />
              ) : (
                <AppText style={styles.buttonText}>{t('auth.verifyEmail')}</AppText>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy || remaining > 0}
              onPress={() => void submit(true)}
              style={styles.link}
            >
              <AppText muted={busy || remaining > 0}>
                {remaining > 0
                  ? t('auth.resendCountdown', {
                      count: remaining,
                    })
                  : t('auth.resendCode')}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={goToSignIn}
              style={styles.link}
            >
              <AppText>{t('auth.backToSignInChangeEmail')}</AppText>
            </Pressable>
          </>
        )}
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  button: {
    backgroundColor: authColors.ink,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  buttonText: { color: authColors.paper, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  error: { color: '#9D1F1F' },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
