import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText, Card, EmptyState, Screen } from '@/components/ui';
import { getItemPreviewImage } from '@/components/domain/ItemCard';
import { colors, mono, spacing } from '@/design-system';
import {
  useCompleteItem,
  useDeleteItem,
  useItem,
  useMoveItem,
  useRestoreItem,
} from '@/features/items/hooks';
import { useLists } from '@/features/lists/hooks';

export default function ItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const item = useItem(itemId);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const lists = useLists(item.data?.space_id ?? '');
  const complete = useCompleteItem(itemId);
  const restore = useRestoreItem(itemId);
  const remove = useDeleteItem(itemId, item.data?.list_id ?? '');
  const move = useMoveItem(itemId, item.data?.list_id ?? '', item.data?.space_id ?? '');
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (item.isLoading)
    return (
      <Screen backgroundColor={mono.background}>
        <Header onBack={goBack} />
        <View style={styles.loader}>
          <ActivityIndicator color={mono.ink} />
        </View>
      </Screen>
    );
  if (!item.data)
    return (
      <Screen backgroundColor={mono.background}>
        <Header onBack={goBack} />
        <EmptyState
          title="İçerik bulunamadı"
          description="Bu içerik artık erişilebilir değil."
        />
      </Screen>
    );

  const value = item.data;
  const completed = value.status === 'completed';

  const confirmDelete = () => {
    Alert.alert('İçeriği sil?', 'Bu içerik listeden kaldırılacak.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => remove.mutate(undefined, { onSuccess: () => router.back() }),
      },
    ]);
  };
  return (
    <Screen scroll backgroundColor={mono.background}>
      <View style={styles.contourTop} pointerEvents="none" />
      <View style={styles.contourBottom} pointerEvents="none" />
      <Header onBack={goBack} />
      <View style={styles.content}>
        <Card style={styles.previewCard}>
          <Image
            source={{ uri: getItemPreviewImage(value) }}
            style={styles.cover}
            resizeMode="cover"
          />
          <AppText variant="pageTitle" style={styles.title}>
            {value.title ?? 'Kaydedilen içerik'}
          </AppText>
          {value.original_url ? (
            <Pressable
              onPress={() => void Linking.openURL(value.original_url!)}
              style={({ pressed }) => [styles.sourceButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Linke git"
            >
              <Ionicons name="open-outline" size={17} color={mono.ink} />
              <AppText style={styles.sourceButtonText}>Linke git</AppText>
            </Pressable>
          ) : null}
          <View style={styles.creatorRow}>
            <Ionicons name="person-outline" size={17} color={colors.secondaryText} />
            <AppText muted>Ekleyen: {value.created_by_name}</AppText>
          </View>
        </Card>
        <Pressable
          onPress={() => (completed ? restore.mutate() : complete.mutate())}
          disabled={complete.isPending || restore.isPending}
          style={({ pressed }) => [
            styles.completeButton,
            completed && styles.restoreButton,
            pressed && styles.pressed,
            (complete.isPending || restore.isPending) && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            completed ? 'Yapılmadı olarak işaretle' : 'Yapıldı olarak işaretle'
          }
        >
          {complete.isPending || restore.isPending ? (
            <ActivityIndicator color={completed ? mono.ink : mono.paper} />
          ) : (
            <>
              <Ionicons
                name={completed ? 'arrow-undo-outline' : 'checkmark-circle-outline'}
                size={20}
                color={completed ? mono.ink : mono.paper}
              />
              <AppText style={[styles.completeText, completed && styles.restoreText]}>
                {completed ? 'Yapılmadı olarak işaretle' : 'Yapıldı olarak işaretle'}
              </AppText>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={() => setIsMoveOpen((current) => !current)}
          style={({ pressed }) => [styles.moveButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Ionicons name="swap-horizontal-outline" size={19} color={mono.ink} />
          <AppText style={styles.moveText}>Başka listeye taşı</AppText>
        </Pressable>
        {isMoveOpen ? (
          <Card style={styles.moveCard}>
            <AppText variant="cardTitle">Hedef liste</AppText>
            {lists.data?.data
              .filter((entry) => entry.id !== value.list_id)
              .map((entry) => (
                <Pressable
                  key={entry.id}
                  disabled={move.isPending}
                  onPress={() =>
                    move.mutate(entry.id, {
                      onSuccess: () => {
                        setIsMoveOpen(false);
                        router.replace(`/list/${entry.id}`);
                      },
                    })
                  }
                  style={({ pressed }) => [styles.moveOption, pressed && styles.pressed]}
                >
                  <AppText style={styles.moveOptionText}>{entry.name}</AppText>
                  <Ionicons name="arrow-forward" size={17} color={mono.ink} />
                </Pressable>
              ))}
            {lists.data?.data.length === 1 ? (
              <AppText muted>Taşımak için bu alanda ikinci bir liste oluştur.</AppText>
            ) : null}
          </Card>
        ) : null}
        <Pressable
          onPress={confirmDelete}
          disabled={remove.isPending}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
            remove.isPending && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="İçeriği sil"
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <AppText style={styles.deleteText}>
            {remove.isPending ? 'Siliniyor...' : 'İçeriği sil'}
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Geri git"
      >
        <Ionicons name="arrow-back" size={22} color={mono.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contourTop: {
    position: 'absolute',
    top: -150,
    right: -155,
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.75,
  },
  contourBottom: {
    position: 'absolute',
    bottom: -160,
    left: -185,
    width: 350,
    height: 350,
    borderRadius: 175,
    borderWidth: 1,
    borderColor: mono.line,
    opacity: 0.5,
  },
  header: { height: 56, justifyContent: 'center', paddingHorizontal: spacing.xs },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.paper,
    borderWidth: 1,
    borderColor: mono.ink,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: spacing.lg,
    padding: spacing.sm,
    paddingBottom: spacing.huge,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
    padding: spacing.lg,
    gap: spacing.sm,
    ...Platform.select({ web: { boxShadow: '0px 7px 0px rgba(0,0,0,0.14)' } }),
  },
  cover: { width: '100%', height: 240, borderRadius: 11, backgroundColor: mono.soft },
  title: { fontSize: 22, fontWeight: '800', color: mono.ink, marginTop: spacing.xs },
  sourceButton: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mono.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: mono.paper,
  },
  sourceButtonText: { color: mono.ink, fontSize: 14, fontWeight: '700' },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  completeButton: {
    minHeight: 54,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: mono.ink,
    ...Platform.select({ web: { boxShadow: '0px 5px 0px rgba(0,0,0,0.16)' } }),
  },
  completeText: { color: mono.paper, fontSize: 15, fontWeight: '700' },
  restoreButton: { backgroundColor: mono.paper, borderWidth: 1, borderColor: mono.ink },
  restoreText: { color: mono.ink },
  deleteButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mono.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: mono.paper,
  },
  deleteText: { color: mono.danger, fontSize: 14, fontWeight: '700' },
  moveButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mono.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: mono.paper,
  },
  moveText: { color: mono.ink, fontSize: 14, fontWeight: '700' },
  moveCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mono.ink,
    backgroundColor: mono.paper,
  },
  moveOption: {
    minHeight: 46,
    paddingHorizontal: spacing.sm,
    borderRadius: 9,
    backgroundColor: mono.soft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moveOptionText: { color: mono.ink, fontWeight: '700' },
  loader: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.55 },
});
