import { fireEvent, render } from '@testing-library/react-native';
import { Platform, Text } from 'react-native';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

import {
  Badge,
  Button,
  Card,
  GlassSurface,
  IconButton,
  Screen,
  SegmentedControl,
} from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

describe('WeDo design system', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    jest.mocked(isLiquidGlassAvailable).mockReturnValue(false);
    jest.mocked(isGlassEffectAPIAvailable).mockReturnValue(false);
  });

  it('exposes the Warm Alabaster & Glass palette, soft shadows and spacing scale', () => {
    expect(colors.background).toBe('#F6F4F0');
    expect(colors.accent).toBe('#111110');
    expect(colors.primaryText).toBe('#111110');
    expect(colors.secondaryText).toBe('#74706A');
    expect(colors.error).toBe('#B84A42');
    expect(radius.pill).toBe(999);
    expect(radius.card).toBe(24);
    expect(spacing.screen).toBe(16);
    expect(shadows.card).toBeDefined();
  });

  it('renders GlassSurface safely across iOS BlurView fallback and Liquid Glass', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });

    const fallbackUi = render(
      <GlassSurface>
        <Text>Fallback glass</Text>
      </GlassSurface>,
    );
    expect(fallbackUi.getByText('Fallback glass')).toBeTruthy();
    fallbackUi.unmount();

    jest.mocked(isLiquidGlassAvailable).mockReturnValue(true);
    jest.mocked(isGlassEffectAPIAvailable).mockReturnValue(true);

    const liquidUi = render(
      <GlassSurface interactive>
        <Text>Liquid glass</Text>
      </GlassSurface>,
    );
    expect(liquidUi.getByText('Liquid glass')).toBeTruthy();
  });

  it('renders Screen, SegmentedControl, Button, Card, Badge and IconButton cleanly', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const onChange = jest.fn();
    const onPress = jest.fn();

    const ui = render(
      <Screen scroll={false}>
        <SegmentedControl
          options={[
            { value: 'all', label: 'All' },
            { value: 'open', label: 'Open' },
            { value: 'done', label: 'Done' },
          ]}
          value="all"
          onChange={onChange}
        />
        <Card>
          <Badge label="Open" tone="neutral" />
          <Button label="Save" onPress={onPress} />
          <Button label="Cancel" variant="secondary" onPress={onPress} />
          <IconButton
            icon={<Text>+</Text>}
            label="Add item"
            tone="dark"
            onPress={onPress}
          />
        </Card>
      </Screen>,
    );

    fireEvent(ui.UNSAFE_getByProps({ accessibilityRole: 'tablist' }), 'layout', {
      nativeEvent: { layout: { width: 300, height: 46, x: 0, y: 0 } },
    });
    fireEvent.press(ui.getByRole('tab', { name: 'Open' }));
    expect(onChange).toHaveBeenCalledWith('open');
    fireEvent.press(ui.getByRole('button', { name: 'Save' }));
    fireEvent.press(ui.getByRole('button', { name: 'Add item' }));
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
