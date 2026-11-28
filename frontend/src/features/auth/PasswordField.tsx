import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { type TextInputProps } from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { TextField } from '@/components/ui';
import { colors } from '@/design-system';

type PasswordFieldProps = Omit<TextInputProps, 'secureTextEntry'> & {
  label: string;
  error?: string;
};

export function PasswordField({
  label,
  error,
  accessibilityLabel,
  ...props
}: PasswordFieldProps) {
  useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      label={label}
      error={error}
      secureTextEntry={!visible}
      accessibilityLabel={accessibilityLabel ?? label}
      rightAccessory={
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          accessibilityHint={t('auth.togglesPasswordVisibility')}
          hitSlop={10}
          pressScale={0.9}
          pressOpacity={0.6}
          haptic="selection"
          onPress={() => setVisible((current) => !current)}
          style={{ padding: 8 }}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={21}
            color={colors.secondaryText}
          />
        </SpringPressable>
      }
    />
  );
}
