import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, typography } from '@/design-system';

type AppTextProps = TextProps & {
  variant?: keyof typeof typography;
  muted?: boolean;
};

export function AppText({ variant = 'body', muted, style, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        styles.base,
        typography.systemFont,
        typography[variant],
        muted && styles.muted,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { color: colors.primaryText },
  muted: { color: colors.secondaryText },
});
