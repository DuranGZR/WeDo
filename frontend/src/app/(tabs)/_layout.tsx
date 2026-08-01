import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';

import { radius } from '@/design-system';

const tabColors = {
  ink: '#090909',
  muted: '#5F5F5D',
  paper: '#FFFFFF',
  soft: '#E7E7E5',
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabColors.ink,
        tabBarInactiveTintColor: tabColors.muted,
        tabBarStyle: {
          backgroundColor: tabColors.paper,
          borderTopWidth: 0,
          borderRadius: 16,
          height: 70,
          left: 20,
          right: 20,
          bottom: 12,
          paddingBottom: Platform.OS === 'ios' ? 10 : 8,
          paddingTop: 8,
          position: 'absolute',
          borderWidth: 1,
          borderColor: tabColors.ink,
          ...Platform.select({
            web: {
              boxShadow: '0px 8px 0px rgba(0, 0, 0, 0.12)',
            },
            default: {
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.14,
              shadowRadius: 0,
              elevation: 6,
            },
          }),
        },
        tabBarItemStyle: {
          borderRadius: radius.lg,
          marginHorizontal: 2,
          marginVertical: 2,
          minHeight: 50,
          justifyContent: 'center',
          overflow: 'hidden',
        },
        tabBarLabelStyle: {
          fontSize: 9,
          lineHeight: 12,
          fontWeight: '700',
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                width: 30,
                height: 26,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? tabColors.soft : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={size - 3}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Listeler',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                width: 30,
                height: 26,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? tabColors.soft : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'list' : 'list-outline'}
                size={size - 3}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                width: 30,
                height: 26,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? tabColors.soft : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={size - 3}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
