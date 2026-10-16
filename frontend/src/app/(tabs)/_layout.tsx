import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { radius } from '@/design-system';

const tabColors = {
  ink: '#090909',
  muted: '#5F5F5D',
  paper: '#FFFFFF',
  soft: '#E7E7E5',
} as const;

export default function TabsLayout() {
  useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Responsive padding: on tablets max 460px centered, on mobile 20px side insets
  const isTablet = width >= 600;
  const horizontalMargin = isTablet ? Math.max(24, Math.floor((width - 460) / 2)) : 20;
  const bottomOffset = Math.max(16, insets.bottom);

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
      screenOptions={{
        headerShown: false,

        lazy: true,
        freezeOnBlur: true,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: tabColors.ink,
        tabBarInactiveTintColor: tabColors.muted,
        tabBarStyle: {
          backgroundColor: tabColors.paper,
          borderRadius: 24,
          height: 64,
          position: 'absolute',
          left: horizontalMargin,
          right: horizontalMargin,
          start: horizontalMargin,
          end: horizontalMargin,
          bottom: bottomOffset,
          paddingBottom: 6,
          paddingTop: 6,
          borderWidth: 1.5,
          borderColor: tabColors.ink,
          ...Platform.select({
            web: {
              boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.12)',
            },
            default: {
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 6,
            },
          }),
        },
        tabBarItemStyle: {
          borderRadius: radius.md,
          marginHorizontal: 2,
          paddingVertical: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          height: 24,
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          lineHeight: 13,
          fontWeight: '700',
          marginTop: 0,
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home.home'),
          tabBarLabel: t('home.home'),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 28,
                height: 23,
                borderRadius: 7,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? tabColors.soft : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={18}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: t('home.lists'),
          tabBarLabel: t('home.lists'),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 28,
                height: 23,
                borderRadius: 7,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? tabColors.soft : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'list' : 'list-outline'}
                size={18}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('common.profile'),
          tabBarLabel: t('common.profile'),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 28,
                height: 23,
                borderRadius: 7,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? tabColors.soft : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={18}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
