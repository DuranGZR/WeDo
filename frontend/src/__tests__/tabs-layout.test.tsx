import { act, render } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import TabsLayout from '@/app/(tabs)/_layout';
import { colors } from '@/design-system';
import { i18n } from '@/i18n';

const capturedTabsProps: Record<string, unknown>[] = [];
const capturedTriggers: { name: string; sf?: unknown; label?: string }[] = [];

jest.mock('expo-router/native-tabs', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');

  const Icon = () => null;
  const Label = ({ children }: { children?: string }) =>
    React.createElement(Text, null, children);

  const Trigger = Object.assign(
    ({ name, children }: { name: string; children?: React.ReactNode }) => {
      let sf: unknown;
      let label: string | undefined;
      React.Children.forEach(children, (child: unknown) => {
        if (!React.isValidElement(child)) return;
        const element = child as React.ReactElement<{ sf?: unknown; children?: string }>;
        if (element.type === Icon) sf = element.props.sf;
        if (element.type === Label) label = element.props.children;
      });
      capturedTriggers.push({ name, sf, label });
      return React.createElement(View, { testID: `tab-trigger-${name}` }, children);
    },
    { Icon, Label },
  );

  const NativeTabs = Object.assign(
    ({ children, ...props }: { children?: React.ReactNode; [k: string]: unknown }) => {
      capturedTabsProps.push(props);
      return React.createElement(View, { testID: 'native-tabs' }, children);
    },
    { Trigger },
  );

  return { NativeTabs };
});

describe('TabsLayout (NativeTabs)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    capturedTabsProps.length = 0;
    capturedTriggers.length = 0;
    await i18n.changeLanguage('tr');
  });

  it('configures 3 NativeTabs triggers with SF Symbols, obsidian tint and scroll minimization', () => {
    const ui = render(<TabsLayout />);

    expect(capturedTabsProps[0]).toMatchObject({
      tintColor: colors.primaryText,
      minimizeBehavior: 'onScrollDown',
      blurEffect: 'systemChromeMaterialLight',
    });

    expect(capturedTriggers).toEqual([
      {
        name: 'index',
        sf: { default: 'house', selected: 'house.fill' },
        label: 'Ana Sayfa',
      },
      {
        name: 'lists',
        sf: { default: 'rectangle.stack', selected: 'rectangle.stack.fill' },
        label: 'Listeler',
      },
      {
        name: 'profile',
        sf: { default: 'person', selected: 'person.fill' },
        label: 'Profil',
      },
    ]);

    expect(ui.getByText('Ana Sayfa')).toBeTruthy();
    expect(ui.getByText('Listeler')).toBeTruthy();
    expect(ui.getByText('Profil')).toBeTruthy();
  });

  it('updates tab labels on language switch and triggers light haptic on tab press', async () => {
    const ui = render(<TabsLayout />);

    const listeners = capturedTabsProps[0]?.screenListeners as
      { tabPress?: () => void } | undefined;
    listeners?.tabPress?.();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);

    await act(async () => {
      await i18n.changeLanguage('en');
    });

    expect(ui.getByText('Home')).toBeTruthy();
    expect(ui.getByText('Lists')).toBeTruthy();
    expect(ui.getByText('Profile')).toBeTruthy();
  });
});
