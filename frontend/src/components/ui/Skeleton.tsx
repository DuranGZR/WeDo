import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/design-system';
export function Skeleton({
  height = 18,
  width = '100%',
}: {
  height?: number;
  width?: number | `${number}%`;
}) {
  return (
    <View accessibilityLabel="Yükleniyor" style={[styles.base, { height, width }]} />
  );
}
const styles = StyleSheet.create({
  base: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm },
});
