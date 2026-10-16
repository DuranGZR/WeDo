import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ApiClientError } from '@/api/client/api-client';
import { queryKeys } from '@/api/query-keys';
import { InfoScreen } from '@/components/layout/InfoScreen';
import { AppText, Button, Screen } from '@/components/ui';
import { spacing } from '@/design-system';
import { collaborationApi } from '@/features/collaboration/api';
import { useSpaces } from '@/features/spaces/hooks';
import { useAuthStore } from '@/store/auth-store';
import { useSpaceStore } from '@/store/space-store';
import InviteInvalidScreen from './invalid';

export default function InviteScreen() {
  const { t, i18n } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();
  const user = useAuthStore((state) => state.user);
  const client = useQueryClient();
  const spaces = useSpaces();
  const preview = useQuery({
    queryKey: ['invitation', token, i18n.language],
    queryFn: () => collaborationApi.invitation(token),
    enabled: Boolean(token),
    retry: false,
  });
  const accept = useMutation({
    mutationFn: () => collaborationApi.acceptInvitation(token),
    onSuccess: async (invitation) => {
      useSpaceStore.getState().setSelectedSpaceId(invitation.space_id);
      await client.invalidateQueries({ queryKey: queryKeys.spaces });
      router.replace('/invite/accepted');
    },
  });
  if (
    !token ||
    (preview.error instanceof ApiClientError &&
      [400, 404, 410].includes(preview.error.status))
  )
    return <InviteInvalidScreen />;
  if (preview.isPending)
    return (
      <Screen>
        <ActivityIndicator accessibilityLabel={t('common.loading')} />
      </Screen>
    );
  if (preview.isError)
    return (
      <InfoScreen
        title={t('invitation.loadFailed')}
        description={preview.error.message}
        action={t('common.retry')}
        onAction={() => void preview.refetch()}
      />
    );
  const invitation = preview.data;
  const alreadyMember = spaces.data?.data.some(
    (space) => space.id === invitation.space_id,
  );
  const openSpace = () => {
    useSpaceStore.getState().setSelectedSpaceId(invitation.space_id);
    router.replace('/(tabs)');
  };
  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="pageTitle">{t('invitation.title')}</AppText>
        <AppText variant="cardTitle">{invitation.space_name}</AppText>
        <AppText muted>
          {t('invitation.description', {
            name: invitation.inviter_name ?? t('invitation.someone'),
          })}
        </AppText>
        {accept.isError && <AppText>{accept.error.message}</AppText>}
        {user ? (
          <Button
            label={t(alreadyMember ? 'common.goToSpace' : 'invitation.join')}
            loading={accept.isPending || spaces.isPending}
            disabled={spaces.isError}
            onPress={alreadyMember ? openSpace : () => accept.mutate()}
          />
        ) : (
          <Button
            label={t('invitation.signIn')}
            onPress={() =>
              router.push({ pathname: '/(auth)/sign-in', params: { inviteToken: token } })
            }
          />
        )}
        {user && spaces.isError && (
          <Button label={t('common.retry')} onPress={() => void spaces.refetch()} />
        )}
        <Button
          label={t('common.backToHome')}
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', gap: spacing.lg },
});
