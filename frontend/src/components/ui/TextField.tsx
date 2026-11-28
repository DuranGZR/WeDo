import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, shadows, spacing, systemFontFamily } from '@/design-system';

type FieldProps = TextInputProps & {
  label?: string;
  error?: string;
  rightAccessory?: ReactNode;
};

export function TextField({
  label,
  error,
  style,
  rightAccessory,
  onFocus,
  onBlur,
  ...props
}: FieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const shakeX = useSharedValue(0);
  const hadError = useSharedValue(Boolean(error));

  useEffect(() => {
    const hasErr = Boolean(error);
    const justErrored = hasErr && !hadError.get();
    hadError.set(hasErr);

    if (justErrored && !reducedMotion) {
      shakeX.set(
        withSequence(
          withTiming(-6, { duration: 48 }),
          withTiming(6, { duration: 48 }),
          withTiming(-4, { duration: 42 }),
          withTiming(3, { duration: 42 }),
          withTiming(0, { duration: 40 }),
        ),
      );
    }
  }, [error, hadError, reducedMotion, shakeX]);

  const fieldAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.get() }],
  }));

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View
        style={[
          styles.field,
          isFocused && styles.focusedField,
          Boolean(error) && styles.errorInput,
          fieldAnimStyle,
        ]}
      >
        <TextInput
          {...props}
          placeholderTextColor={colors.tertiaryText}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            rightAccessory ? styles.inputWithAccessory : undefined,
            style,
          ]}
          accessibilityLabel={props.accessibilityLabel ?? label ?? props.placeholder}
        />
        {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
      </Animated.View>
      {error ? (
        <Animated.Text
          entering={reducedMotion ? undefined : FadeInDown.duration(160)}
          style={styles.errorText}
        >
          {error}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: systemFontFamily,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: '#FAF8F5',
  },
  focusedField: {
    borderColor: colors.borderFocus,
    borderWidth: 1.25,
    backgroundColor: colors.surface,
    ...shadows.glass,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    color: colors.primaryText,
    fontSize: 16,
    fontFamily: systemFontFamily,
  },
  inputWithAccessory: { paddingRight: spacing.sm },
  accessory: { height: 48, justifyContent: 'center', paddingRight: spacing.sm },
  errorInput: { borderColor: colors.error, borderWidth: 1.25 },
  errorText: { color: colors.error, fontSize: 12, fontFamily: systemFontFamily },
});
