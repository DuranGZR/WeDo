import { StyleSheet, View } from 'react-native';
import { spacing } from '@/design-system';
import { AppText } from './AppText';

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="sectionTitle">{title}</AppText>
      {action}
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
});
