import { StyleSheet, View } from 'react-native';
import { colors } from '@/design-system';
import { AppText } from './AppText';

export function Avatar({ name, size = 44 }: { name?: string | null; size?: number }) {
  return (
    <View
      accessible
      accessibilityLabel={`${name ?? 'Kullanıcı'} avatarı`}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <AppText style={[styles.text, { fontSize: size * 0.4 }]}>
        {name?.trim().charAt(0).toUpperCase() ?? 'W'}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryText,
  },
  text: { color: colors.surface, fontWeight: '700' },
});
