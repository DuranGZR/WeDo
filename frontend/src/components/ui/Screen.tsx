import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  type ScrollViewProps,
  type ViewProps,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
  type Edge,
} from 'react-native-safe-area-context';

import { colors, spacing } from '@/design-system';
import { AmbientBackground, type AmbientBackgroundVariant } from './AmbientBackground';

type ScreenProps = (ScrollViewProps | ViewProps) & {
  scroll?: boolean;
  children: React.ReactNode;
  backgroundColor?: string;
  ambient?: boolean | AmbientBackgroundVariant;
  keyboardVerticalOffset?: number;
  dismissKeyboardOnTap?: boolean;
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Screen({
  scroll = true,
  children,
  backgroundColor,
  ambient = true,
  keyboardVerticalOffset = 0,
  dismissKeyboardOnTap = true,
  edges = ['top', 'bottom'],
  refreshing = false,
  onRefresh,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { contentContainerStyle, ...scrollProps } = props as ScrollViewProps;
  const { style: viewStyle, ...viewProps } = props as ViewProps;
  const adjustsKeyboardInsets =
    scroll && Platform.OS === 'ios' && scrollProps.automaticallyAdjustKeyboardInsets;

  const verticalOffset =
    Platform.OS === 'ios' ? insets.top + keyboardVerticalOffset : keyboardVerticalOffset;

  const resolvedBackground = backgroundColor ?? colors.background;
  const ambientVariant: AmbientBackgroundVariant | null =
    ambient === false ? null : ambient === true ? 'default' : ambient;

  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9E7F60"
            colors={['#9E7F60']}
          />
        ) : (
          scrollProps.refreshControl
        )
      }
      {...scrollProps}
      contentContainerStyle={[styles.content, contentContainerStyle]}
    >
      {children}
    </ScrollView>
  ) : dismissKeyboardOnTap ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View {...viewProps} style={[styles.content, viewStyle]}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  ) : (
    <View {...viewProps} style={[styles.content, viewStyle]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: resolvedBackground }]}>
      {ambientVariant ? (
        <AmbientBackground
          variant={ambientVariant}
          backgroundColor={resolvedBackground}
        />
      ) : null}
      <SafeAreaView style={styles.safe} edges={edges}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          enabled={!adjustsKeyboardInsets}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={verticalOffset}
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: 'transparent' },
  keyboardAvoid: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: spacing.screen,
    paddingBottom: spacing.huge,
  },
});
