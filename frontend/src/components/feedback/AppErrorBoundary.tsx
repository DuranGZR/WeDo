import { t, i18n } from '@/i18n';
import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText, Button } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { haptic } from '@/lib/haptics';

type State = { error: Error | null };

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  override state: State = { error: null };
  private refreshLanguage = () => this.forceUpdate();
  override componentDidMount() {
    i18n.on('languageChanged', this.refreshLanguage);
  }
  override componentWillUnmount() {
    i18n.off('languageChanged', this.refreshLanguage);
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('wedo.error_boundary', error, info);
  }

  handleRetry = () => {
    haptic.medium();
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.outerRing}>
            <View style={styles.iconCircle}>
              <Ionicons name="warning-outline" size={32} color={colors.error} />
            </View>
          </View>
          <AppText variant="pageTitle" style={styles.title}>
            {t('common.somethingWentWrong')}
          </AppText>
          <AppText muted style={styles.subtitle}>
            {t('common.theAppRanIntoATemporaryProblemYourDataIs')}
          </AppText>
          <View style={styles.actionWrap}>
            <Button
              label={t('common.tryAgain')}
              onPress={this.handleRetry}
              variant="primary"
              hapticFeedback="medium"
            />
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screen,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.elevated,
  },
  outerRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(184, 74, 66, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorSoft,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(184, 74, 66, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondaryText,
  },
  actionWrap: {
    width: '100%',
    marginTop: spacing.xs,
  },
});
