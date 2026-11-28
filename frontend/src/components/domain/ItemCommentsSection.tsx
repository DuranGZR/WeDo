import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { useToast } from '@/components/feedback/AppToast';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, Card, Skeleton } from '@/components/ui';
import { colors, radius, spacing } from '@/design-system';
import type { Comment } from '@/features/collaboration/api';
import {
  useCreateComment,
  useDeleteComment,
  useItemComments,
  useSpaceMembers,
  useUpdateComment,
} from '@/features/collaboration/hooks';
import { formatChatDayDivider, formatLocale, formatPlanTimeLabel, t } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { useAuthStore } from '@/store/auth-store';

function calendarDayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

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
  const [selectedOwnId, setSelectedOwnId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');

  const memberNameByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of membersQuery.data?.data ?? []) {
      map.set(member.user_id, member.display_name);
    }
    return map;
  }, [membersQuery.data?.data]);

  const comments: Comment[] = commentsQuery.data?.data ?? [];

  const handleSend = () => {
    const text = draft.trim();
    if (!text || createComment.isPending) return;
    createComment.mutate(text, {
      onSuccess: () => {
        setDraft('');
        setSelectedOwnId(null);
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
          setSelectedOwnId(null);
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
              setSelectedOwnId(null);
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
            <Ionicons name="chatbubble-ellipses-outline" size={15} color="#9E7F60" />
          </View>
          <AppText variant="sectionTitle" style={styles.title}>
            {t('items.commentsTitle')}
          </AppText>
        </View>
        {comments.length > 0 ? (
          <View style={styles.countBadge}>
            <AppText style={styles.countText}>{comments.length}</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.chatCanvas}>
        {commentsQuery.isLoading ? (
          <View style={styles.skeletonList}>
            <Skeleton width="72%" height={40} borderRadius={16} />
            <Skeleton
              width="62%"
              height={40}
              borderRadius={16}
              style={styles.skeletonRight}
            />
          </View>
        ) : comments.length === 0 ? (
          <AppText variant="caption" muted style={styles.emptyText}>
            {t('items.noCommentsYet')}
          </AppText>
        ) : (
          <View style={styles.thread}>
            {comments.map((comment, index) => {
              const previous = index > 0 ? comments[index - 1] : undefined;
              const next = index < comments.length - 1 ? comments[index + 1] : undefined;
              const currentDay = calendarDayKey(comment.created_at);
              const previousDay = previous ? calendarDayKey(previous.created_at) : null;
              const showDayDivider = currentDay !== previousDay;

              const isOwn = Boolean(ownId && comment.user_id === ownId);
              const sameSenderAsPrevious =
                !showDayDivider && previous?.user_id === comment.user_id;
              const sameSenderAsNext =
                next &&
                calendarDayKey(next.created_at) === currentDay &&
                next.user_id === comment.user_id;

              const isFirstInRun = !sameSenderAsPrevious;
              const isLastInRun = !sameSenderAsNext;

              const author =
                memberNameByUserId.get(comment.user_id) ?? t('common.someone');
              const initial = author.trim().charAt(0).toLocaleUpperCase(locale) || 'W';
              const isEditing = editingId === comment.id;
              const showOwnMenu = isOwn && !isEditing && selectedOwnId === comment.id;

              return (
                <View key={comment.id}>
                  {showDayDivider ? (
                    <View style={styles.dayDividerWrap}>
                      <View style={styles.dayDividerPill}>
                        <AppText style={styles.dayDividerText}>
                          {formatChatDayDivider(comment.created_at)}
                        </AppText>
                      </View>
                    </View>
                  ) : null}

                  <Animated.View
                    entering={
                      reducedMotion
                        ? undefined
                        : FadeInDown.delay(Math.min(index, 5) * 25).duration(180)
                    }
                    layout={reducedMotion ? undefined : LAYOUT_SPRING}
                    style={[
                      styles.messageRow,
                      isOwn ? styles.messageRowOwn : styles.messageRowPartner,
                      isFirstInRun ? styles.rowGroupStart : styles.rowGroupContinue,
                    ]}
                  >
                    {!isOwn ? (
                      <View style={styles.avatarSlot}>
                        {isFirstInRun ? (
                          <View style={styles.partnerAvatar}>
                            <AppText style={styles.partnerAvatarText}>{initial}</AppText>
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    <View
                      style={[
                        styles.bubbleColumn,
                        isOwn ? styles.bubbleColumnOwn : styles.bubbleColumnPartner,
                      ]}
                    >
                      {isEditing ? (
                        <View
                          style={[styles.bubble, styles.bubbleOwn, styles.editBubble]}
                        >
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
                        <Pressable
                          accessibilityRole={isOwn ? 'button' : undefined}
                          accessibilityHint={
                            isOwn ? t('items.commentActionsHint') : undefined
                          }
                          onPress={
                            isOwn
                              ? () => {
                                  haptic.selection();
                                  setSelectedOwnId((prev) =>
                                    prev === comment.id ? null : comment.id,
                                  );
                                }
                              : undefined
                          }
                          onLongPress={
                            isOwn
                              ? () => {
                                  haptic.medium();
                                  setSelectedOwnId(comment.id);
                                }
                              : undefined
                          }
                          style={[
                            styles.bubble,
                            isOwn ? styles.bubbleOwn : styles.bubblePartner,
                            isOwn && isLastInRun && styles.bubbleOwnTail,
                            !isOwn && isFirstInRun && styles.bubblePartnerTail,
                          ]}
                        >
                          {!isOwn && isFirstInRun ? (
                            <AppText style={styles.partnerName}>{author}</AppText>
                          ) : null}

                          <AppText style={styles.bodyText}>{comment.body}</AppText>

                          <View style={styles.bubbleFooter}>
                            <AppText
                              style={[styles.timeText, isOwn && styles.timeTextOwn]}
                            >
                              {formatPlanTimeLabel(comment.created_at)}
                            </AppText>
                            {isOwn ? (
                              <Ionicons name="checkmark-done" size={13} color="#8D6F52" />
                            ) : null}
                          </View>
                        </Pressable>
                      )}

                      {showOwnMenu ? (
                        <View style={styles.ownQuickMenu}>
                          <SpringPressable
                            accessibilityRole="button"
                            accessibilityLabel={t('lists.edit')}
                            pressScale={0.94}
                            haptic="selection"
                            onPress={() => {
                              setEditingId(comment.id);
                              setEditingBody(comment.body);
                              setSelectedOwnId(null);
                            }}
                            style={styles.quickActionPill}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={12}
                              color={colors.primaryText}
                            />
                            <AppText style={styles.quickActionText}>
                              {t('lists.edit')}
                            </AppText>
                          </SpringPressable>
                          <SpringPressable
                            accessibilityRole="button"
                            accessibilityLabel={t('items.delete')}
                            pressScale={0.94}
                            haptic="warning"
                            onPress={() => handleDelete(comment.id)}
                            style={[styles.quickActionPill, styles.quickDeletePill]}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={12}
                              color={colors.error}
                            />
                            <AppText style={styles.quickDeleteText}>
                              {t('items.delete')}
                            </AppText>
                          </SpringPressable>
                        </View>
                      ) : null}
                    </View>
                  </Animated.View>
                </View>
              );
            })}
          </View>
        )}
      </View>

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
    gap: spacing.sm + 4,
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
    width: 28,
    height: 28,
    borderRadius: 14,
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
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  chatCanvas: {
    borderRadius: 18,
    backgroundColor: '#F4F1EA',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 4,
  },
  skeletonList: {
    gap: spacing.sm,
  },
  skeletonRight: {
    alignSelf: 'flex-end',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  thread: {
    gap: 2,
  },
  dayDividerWrap: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: spacing.xs + 2,
  },
  dayDividerPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(17, 17, 16, 0.06)',
  },
  dayDividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageRowPartner: {
    justifyContent: 'flex-start',
    gap: 6,
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  rowGroupStart: {
    marginTop: 7,
  },
  rowGroupContinue: {
    marginTop: 2,
  },
  avatarSlot: {
    width: 24,
    alignItems: 'center',
  },
  partnerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8DFD1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerAvatarText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#5F4932',
  },
  bubbleColumn: {
    maxWidth: '82%',
    gap: 4,
  },
  bubbleColumnOwn: {
    alignItems: 'flex-end',
  },
  bubbleColumnPartner: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 6,
    borderRadius: 16,
    gap: 2,
  },
  bubblePartner: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17, 17, 16, 0.06)',
  },
  bubblePartnerTail: {
    borderTopLeftRadius: 5,
  },
  bubbleOwn: {
    backgroundColor: '#EFE4D4',
    borderWidth: 1,
    borderColor: 'rgba(158, 127, 96, 0.22)',
  },
  bubbleOwnTail: {
    borderBottomRightRadius: 5,
  },
  partnerName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#8D6F52',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 19.5,
    color: colors.primaryText,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 1,
  },
  timeText: {
    fontSize: 10,
    lineHeight: 13,
    color: colors.tertiaryText,
  },
  timeTextOwn: {
    color: '#7E6A56',
  },
  ownQuickMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primaryText,
  },
  quickDeletePill: {
    borderColor: 'rgba(184, 74, 66, 0.22)',
  },
  quickDeleteText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.error,
  },
  editBubble: {
    minWidth: 220,
    gap: spacing.xs,
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
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  smallGhostText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  smallSaveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
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
  },
  input: {
    flex: 1,
    minHeight: 40,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#9E7F60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
