import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design-system';

type ScreenProps = (ScrollViewProps | ViewProps) & {
  scroll?: boolean;
  children: React.ReactNode;
  backgroundColor?: string;
};

export function Screen({
  scroll = true,
  children,
  backgroundColor,
  ...props
}: ScreenProps) {
  const { contentContainerStyle, ...scrollProps } = props as ScrollViewProps;
  const { style: viewStyle, ...viewProps } = props as ViewProps;
  return (
    <SafeAreaView
      style={[styles.safe, backgroundColor && { backgroundColor }]}
      edges={['top', 'bottom']}
    >
      {scroll ? (
        <ScrollView
          {...scrollProps}
          contentContainerStyle={[styles.content, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View {...viewProps} style={[styles.content, viewStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: spacing.screen,
    paddingBottom: spacing.huge,
  },
});
