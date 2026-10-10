import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, systemFontFamily } from '@/design-system';

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

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          isFocused && styles.focusedField,
          error && styles.errorInput,
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
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  focusedField: {
    borderColor: '#090909',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    color: colors.primaryText,
    fontSize: 16,
    fontFamily: systemFontFamily,
  },
  inputWithAccessory: { paddingRight: spacing.sm },
  accessory: { height: 50, justifyContent: 'center', paddingRight: spacing.sm },
  errorInput: { borderColor: colors.error, borderWidth: 1.5 },
  errorText: { color: colors.error, fontSize: 12, fontFamily: systemFontFamily },
});
