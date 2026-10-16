import { t, i18n } from '@/i18n';
import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText, Button } from '@/components/ui';
import { colors, mono, radius, spacing } from '@/design-system';
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
              <Ionicons name="warning-outline" size={32} color="#E5484D" />
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
    backgroundColor: '#F7F6F2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screen,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: mono.paper,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#090909',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  outerRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: '#F8D7DA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: mono.paper,
    borderWidth: 1.5,
    borderColor: '#E5484D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#5F5F5D',
  },
  actionWrap: {
    width: '100%',
    marginTop: spacing.xs,
  },
});
