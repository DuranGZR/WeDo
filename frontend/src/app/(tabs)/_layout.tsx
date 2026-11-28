import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';

import { colors } from '@/design-system';
import { t } from '@/i18n';
import { haptic } from '@/lib/haptics';

export default function TabsLayout() {
  useTranslation();

  return (
    <NativeTabs
      tintColor={colors.primaryText}
      minimizeBehavior="onScrollDown"
      blurEffect="systemChromeMaterialLight"
      screenListeners={{
        tabPress: () => {
          haptic.light();
        },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>{t('home.home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="lists">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'rectangle.stack', selected: 'rectangle.stack.fill' }}
        />
        <NativeTabs.Trigger.Label>{t('home.lists')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <NativeTabs.Trigger.Label>{t('common.profile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
