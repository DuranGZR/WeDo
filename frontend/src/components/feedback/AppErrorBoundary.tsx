import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { colors, spacing } from '@/design-system';

type State = { error: Error | null };
export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  override state: State = { error: null };
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('wedo.error_boundary', error, info);
  }
  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <AppText variant="pageTitle">Bir şeyler ters gitti</AppText>
        <AppText muted>Uygulama beklenmeyen bir durumla karşılaştı.</AppText>
        <Button label="Tekrar dene" onPress={() => this.setState({ error: null })} />
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.screen,
    gap: spacing.lg,
  },
});
