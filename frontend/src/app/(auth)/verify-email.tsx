import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AuthShell, authColors } from '@/components/auth/AuthShell';
import { AppText, TextField } from '@/components/ui';
import { spacing } from '@/design-system';
import { resendVerification, verifyEmail } from '@/features/auth/email-verification';

export default function VerifyEmailScreen() {
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
        setNotice(
          'Doğrulama kodun gönderildi. Gelen kutunu ve spam klasörünü kontrol et.',
        );
      } else {
        await verifyEmail(verificationId, code);
        setVerified(true);
      }
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'İşlem tamamlanamadı. Tekrar dene.',
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <AuthShell
      footer={<AppText muted>Kodunu yalnızca WeDo uygulamasına gir.</AppText>}
      title={verified ? 'E-postan doğrulandı' : 'E-postanı doğrula'}
      subtitle={
        verified
          ? 'Artık e-posta adresin ve şifrenle giriş yapabilirsin.'
          : `${email ?? 'E-posta adresin'} adresine gönderdiğimiz 6 haneli kodu gir.`
      }
    >
      <View style={styles.form}>
        {verified || !verificationId ? (
          <Pressable
            accessibilityRole="button"
            style={styles.button}
            onPress={goToSignIn}
          >
            <AppText style={styles.buttonText}>Giriş yap</AppText>
          </Pressable>
        ) : (
          <>
            <TextField
              label="Doğrulama kodu"
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
            <AppText muted>
              Kod 10 dakika geçerlidir. E-posta gelmediyse spam klasörünü de kontrol et.
            </AppText>
            {error ? (
              <AppText accessibilityRole="alert" style={styles.error}>
                {error}
              </AppText>
            ) : null}
            {notice ? <AppText accessibilityLiveRegion="polite">{notice}</AppText> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="E-postamı doğrula"
              disabled={busy || code.length !== 6}
              onPress={() => void submit(false)}
              style={[styles.button, (busy || code.length !== 6) && styles.disabled]}
            >
              {busy ? (
                <ActivityIndicator color={authColors.paper} />
              ) : (
                <AppText style={styles.buttonText}>E-postamı doğrula</AppText>
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
                  ? `Yeni kod için ${remaining} saniye bekle`
                  : 'Kodu tekrar gönder'}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={goToSignIn}
              style={styles.link}
            >
              <AppText>Giriş ekranına dön / E-posta adresini değiştir</AppText>
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
