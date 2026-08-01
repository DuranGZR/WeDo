import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, type TextInputProps } from 'react-native';

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
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      label={label}
      error={error}
      secureTextEntry={!visible}
      accessibilityLabel={accessibilityLabel ?? label}
      rightAccessory={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
          accessibilityHint="Şifre görünürlüğünü değiştirir"
          hitSlop={10}
          onPress={() => setVisible((current) => !current)}
          style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: 8 })}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={21}
            color={colors.secondaryText}
          />
        </Pressable>
      }
    />
  );
}
