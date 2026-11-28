import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { useToast } from '@/components/feedback/AppToast';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, Card, Skeleton } from '@/components/ui';
import { colors, radius, spacing } from '@/design-system';
import {
  useCreateComment,
  useDeleteComment,
  useItemComments,
  useSpaceMembers,
  useUpdateComment,
} from '@/features/collaboration/hooks';
import { formatLocale, formatRelativeTime, t } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { useAuthStore } from '@/store/auth-store';

export function ItemCommentsSection({
  itemId,
  spaceId,
}: {
  itemId: string;
  spaceId: string;
}) {
  useTranslation();
  const locale = formatLocale();
  const reducedMotion = useReducedMotion();
  const ownId = useAuthStore((state) => state.user?.id);
  const { showToast } = useToast();

  const commentsQuery = useItemComments(itemId);
  const membersQuery = useSpaceMembers(spaceId);
  const createComment = useCreateComment(itemId);
  const updateComment = useUpdateComment(itemId);
  const deleteComment = useDeleteComment(itemId);

  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');

  const memberNameByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of membersQuery.data?.data ?? []) {
      map.set(member.user_id, member.display_name);
    }
    return map;
  }, [membersQuery.data?.data]);

  const comments = commentsQuery.data?.data ?? [];

  const handleSend = () => {
    const text = draft.trim();
    if (!text || createComment.isPending) return;
    createComment.mutate(text, {
      onSuccess: () => {
        setDraft('');
      },
      onError: (err) => {
        showToast({
          type: 'error',
          title: t('settings.couldnTSave'),
          message: err instanceof Error ? err.message : t('common.tryAgainShort'),
        });
      },
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const text = editingBody.trim();
    if (!text) return;
    updateComment.mutate(
      { commentId: editingId, body: text },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditingBody('');
        },
        onError: (err) => {
          showToast({
            type: 'error',
            title: t('settings.couldnTSave'),
            message: err instanceof Error ? err.message : t('common.tryAgainShort'),
          });
        },
      },
    );
  };

  const handleDelete = (commentId: string) => {
    haptic.warning();
    Alert.alert(t('items.deleteCommentConfirm'), t('lists.thisCanTBeUndone'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('items.delete'),
        style: 'destructive',
        onPress: () => {
          deleteComment.mutate(commentId, {
            onSuccess: () => {
              showToast({ type: 'success', title: t('items.commentDeleted') });
            },
          });
        },
      },
    ]);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#9E7F60" />
          </View>
          <AppText variant="sectionTitle" style={styles.title}>
            {t('items.commentsTitle')}
          </AppText>
        </View>
        <View style={styles.countBadge}>
          <AppText style={styles.countText}>{comments.length}</AppText>
        </View>
      </View>

      {commentsQuery.isLoading ? (
        <View style={styles.skeletonList}>
          <Skeleton width="85%" height={42} borderRadius={14} />
          <Skeleton width="65%" height={42} borderRadius={14} />
        </View>
      ) : comments.length === 0 ? (
        <AppText variant="caption" muted style={styles.emptyText}>
          {t('items.noCommentsYet')}
        </AppText>
      ) : (
        <View style={styles.commentList}>
          {comments.map((comment, index) => {
            const author = memberNameByUserId.get(comment.user_id) ?? t('common.someone');
            const initial = author.trim().charAt(0).toLocaleUpperCase(locale) || 'W';
            const isOwn = comment.user_id === ownId;
            const isEditing = editingId === comment.id;

            return (
              <Animated.View
                key={comment.id}
                entering={
                  reducedMotion
                    ? undefined
                    : FadeInDown.delay(Math.min(index, 5) * 30).duration(200)
                }
                layout={reducedMotion ? undefined : LAYOUT_SPRING}
                style={[styles.commentBubble, isOwn && styles.commentBubbleOwn]}
              >
                <View style={[styles.avatar, isOwn && styles.avatarOwn]}>
                  <AppText style={[styles.avatarText, isOwn && styles.avatarTextOwn]}>
                    {initial}
                  </AppText>
                </View>

                <View style={styles.commentContent}>
                  <View style={styles.commentMeta}>
                    <AppText style={styles.authorName}>{author}</AppText>
                    <AppText variant="caption" muted style={styles.timeText}>
                      {formatRelativeTime(comment.created_at)}
                    </AppText>
                  </View>

                  {isEditing ? (
                    <View style={styles.editBox}>
                      <TextInput
                        value={editingBody}
                        onChangeText={setEditingBody}
                        style={styles.editInput}
                        multiline
                        maxLength={1000}
                        autoFocus
                      />
                      <View style={styles.editActions}>
                        <SpringPressable
                          accessibilityRole="button"
                          pressScale={0.94}
                          haptic="selection"
                          onPress={() => {
                            setEditingId(null);
                            setEditingBody('');
                          }}
                          style={styles.smallGhostBtn}
                        >
                          <AppText style={styles.smallGhostText}>
                            {t('items.cancel')}
                          </AppText>
                        </SpringPressable>
                        <SpringPressable
                          accessibilityRole="button"
                          pressScale={0.94}
                          haptic="medium"
                          disabled={updateComment.isPending || !editingBody.trim()}
                          onPress={handleSaveEdit}
                          style={styles.smallSaveBtn}
                        >
                          <AppText style={styles.smallSaveText}>
                            {t('sharing.save')}
                          </AppText>
                        </SpringPressable>
                      </View>
                    </View>
                  ) : (
                    <AppText style={styles.bodyText}>{comment.body}</AppText>
                  )}
                </View>

                {isOwn && !isEditing ? (
                  <View style={styles.ownActions}>
                    <SpringPressable
                      accessibilityRole="button"
                      accessibilityLabel={t('lists.edit')}
                      hitSlop={6}
                      pressScale={0.9}
                      haptic="selection"
                      onPress={() => {
                        setEditingId(comment.id);
                        setEditingBody(comment.body);
                      }}
                      style={styles.microBtn}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={14}
                        color={colors.secondaryText}
                      />
                    </SpringPressable>
                    <SpringPressable
                      accessibilityRole="button"
                      accessibilityLabel={t('items.delete')}
                      hitSlop={6}
                      pressScale={0.9}
                      haptic="warning"
                      onPress={() => handleDelete(comment.id)}
                      style={styles.microBtn}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.error} />
                    </SpringPressable>
                  </View>
                ) : null}
              </Animated.View>
            );
          })}
        </View>
      )}

      <View style={styles.composerRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('items.commentPlaceholder')}
          placeholderTextColor={colors.tertiaryText}
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          style={styles.input}
        />
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('items.sendComment')}
          pressScale={0.9}
          haptic={draft.trim() ? 'medium' : 'none'}
          disabled={!draft.trim() || createComment.isPending}
          onPress={handleSend}
          style={[
            styles.sendBtn,
            (!draft.trim() || createComment.isPending) && styles.sendBtnDisabled,
          ]}
        >
          <Ionicons name="arrow-up" size={18} color={colors.onAccent} />
        </SpringPressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  skeletonList: {
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    paddingVertical: spacing.xs,
  },
  commentList: {
    gap: spacing.sm,
  },
  commentBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
  },
  commentBubbleOwn: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: 'rgba(158, 127, 96, 0.24)',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 17, 16, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  avatarOwn: {
    backgroundColor: '#9E7F60',
  },
  avatarText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primaryText,
  },
  avatarTextOwn: {
    color: '#FFFFFF',
  },
  commentContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  authorName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primaryText,
  },
  timeText: {
    fontSize: 11,
  },
  bodyText: {
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.primaryText,
  },
  ownActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  microBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBox: {
    gap: spacing.xs,
    marginTop: 2,
  },
  editInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4BEA4',
    borderRadius: 12,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    fontSize: 13.5,
    color: colors.primaryText,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  smallGhostBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  smallGhostText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  smallSaveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  smallSaveText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onAccent,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  input: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.primaryText,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9E7F60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
