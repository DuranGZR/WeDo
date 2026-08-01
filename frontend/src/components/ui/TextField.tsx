import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, systemFontFamily } from '@/design-system';

type FieldProps = TextInputProps & { label?: string; error?: string };

export function TextField({ label, error, style, ...props }: FieldProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        placeholderTextColor={colors.tertiaryText}
        style={[styles.input, error && styles.errorInput, style]}
        accessibilityLabel={props.accessibilityLabel ?? label ?? props.placeholder}
      />
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
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    color: colors.primaryText,
    fontSize: 16,
    fontFamily: systemFontFamily,
  },
  errorInput: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 12, fontFamily: systemFontFamily },
});
