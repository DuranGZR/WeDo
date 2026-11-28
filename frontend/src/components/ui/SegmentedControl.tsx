import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { SLIDE_SPRING } from '@/components/motion/springs';
import { colors, radius, shadows, spacing } from '@/design-system';
import { AppText } from './AppText';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

const TRACK_PADDING = 4;
const SEGMENT_GAP = 2;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (nextValue: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const segmentWidth =
    trackWidth > 0 && options.length > 0
      ? (trackWidth - TRACK_PADDING * 2 - SEGMENT_GAP * Math.max(0, options.length - 1)) /
        options.length
      : 0;

  const translateX = useSharedValue(0);
  const hasMeasured = useSharedValue(false);

  useEffect(() => {
    if (segmentWidth <= 0) return;
    const target = selectedIndex * (segmentWidth + SEGMENT_GAP);
    if (!hasMeasured.get() || reducedMotion) {
      translateX.set(target);
      hasMeasured.set(true);
      return;
    }
    translateX.set(withSpring(target, SLIDE_SPRING));
  }, [hasMeasured, reducedMotion, segmentWidth, selectedIndex, translateX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (Math.abs(nextWidth - trackWidth) > 0.5) {
          setTrackWidth(nextWidth);
        }
      }}
      style={[styles.track, style]}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.slidingThumb, { width: segmentWidth }, thumbStyle]}
        />
      ) : null}

      {options.map((option) => {
        const selected = option.value === value;
        return (
          <SpringPressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            pressScale={0.96}
            pressOpacity={0.85}
            haptic={selected ? 'none' : 'selection'}
            onPress={() => {
              if (option.value === value) return;
              onChange(option.value);
            }}
            style={[
              styles.item,
              segmentWidth === 0 && selected && styles.selectedItemFallback,
            ]}
          >
            <AppText
              variant="secondary"
              numberOfLines={1}
              style={[styles.label, selected && styles.selectedLabel]}
            >
              {option.label}
            </AppText>
          </SpringPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    padding: TRACK_PADDING,
    gap: SEGMENT_GAP,
    backgroundColor: '#EFEBE4',
    borderWidth: 1,
    borderColor: 'rgba(17, 17, 16, 0.08)',
  },
  slidingThumb: {
    position: 'absolute',
    left: TRACK_PADDING,
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    ...shadows.glass,
  },
  item: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    zIndex: 1,
  },
  selectedItemFallback: {
    backgroundColor: colors.accent,
    ...shadows.glass,
  },
  label: {
    color: colors.secondaryText,
    fontWeight: '500',
  },
  selectedLabel: {
    color: colors.onAccent,
    fontWeight: '600',
  },
});
