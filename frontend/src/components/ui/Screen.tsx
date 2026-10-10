import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  type ScrollViewProps,
  type ViewProps,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design-system';

type ScreenProps = (ScrollViewProps | ViewProps) & {
  scroll?: boolean;
  children: React.ReactNode;
  backgroundColor?: string;
  keyboardVerticalOffset?: number;
  dismissKeyboardOnTap?: boolean;
};

export function Screen({
  scroll = true,
  children,
  backgroundColor,
  keyboardVerticalOffset = 0,
  dismissKeyboardOnTap = true,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { contentContainerStyle, ...scrollProps } = props as ScrollViewProps;
  const { style: viewStyle, ...viewProps } = props as ViewProps;

  const verticalOffset =
    Platform.OS === 'ios' ? insets.top + keyboardVerticalOffset : keyboardVerticalOffset;

  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
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
    <SafeAreaView
      style={[styles.safe, backgroundColor && { backgroundColor }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={verticalOffset}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
