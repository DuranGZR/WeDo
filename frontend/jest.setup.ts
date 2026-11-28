jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'tr-TR', languageCode: 'tr' }]),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getAllSync: jest.fn(() => []),
  })),
}));
jest.mock('expo-image', () => {
  const React = jest.requireActual('react');
  const { Image } = jest.requireActual('react-native');
  return {
    Image: ({
      contentFit,
      transition: _transition,
      cachePolicy: _cachePolicy,
      ...props
    }: {
      contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
      transition?: number;
      cachePolicy?: string;
      [k: string]: unknown;
    }) =>
      React.createElement(Image, {
        ...props,
        resizeMode: contentFit === 'contain' ? 'contain' : 'cover',
      }),
  };
});
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn().mockResolvedValue(''),
  setStringAsync: jest.fn().mockResolvedValue(true),
  hasUrlAsync: jest.fn().mockResolvedValue(false),
}));
jest.mock('expo-calendar', () => {
  const createEvent = jest.fn().mockResolvedValue({ id: 'event-1' });
  const defaultCalendar = {
    id: 'default-cal',
    title: 'Calendar',
    allowsModifications: true,
    isPrimary: true,
    source: { name: 'iCloud', type: 'caldav' },
    createEvent,
  };
  return {
    EntityTypes: { EVENT: 'event' },
    CalendarAccessLevel: { OWNER: 'owner', READ: 'read', WRITE: 'write' },
    requestCalendarPermissions: jest.fn().mockResolvedValue({ status: 'granted' }),
    getCalendars: jest.fn().mockResolvedValue([defaultCalendar]),
    getDefaultCalendarSync: jest.fn(() => defaultCalendar),
  };
});
jest.mock('react-native-gesture-handler', () => {
  const React = jest.requireActual('react');
  const { View, TouchableOpacity } = jest.requireActual('react-native');
  const Swipeable = React.forwardRef(function MockSwipeable(
    { children }: { children?: React.ReactNode },
    ref: React.Ref<{ close: () => void }>,
  ) {
    React.useImperativeHandle(ref, () => ({ close: jest.fn() }));
    return React.createElement(View, null, children);
  });
  return {
    GestureHandlerRootView: View,
    Swipeable,
    RectButton: TouchableOpacity,
  };
});
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const ReanimatedSwipeable = React.forwardRef(function MockReanimatedSwipeable(
    { children }: { children?: React.ReactNode },
    ref: React.Ref<{ close: () => void }>,
  ) {
    React.useImperativeHandle(ref, () => ({ close: jest.fn() }));
    return React.createElement(View, null, children);
  });
  return {
    __esModule: true,
    default: ReanimatedSwipeable,
  };
});
jest.mock('react-native-svg', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: View,
    Svg: View,
    Rect: View,
    Path: View,
    Circle: View,
  };
});
jest.mock('@react-native-community/datetimepicker', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => React.createElement(View, props),
  };
});
// Native hardware modules do not run inside Jest's JavaScript environment.
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
jest.mock('expo-glass-effect', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    GlassView: ({ children, ...props }: { children?: unknown }) =>
      React.createElement(View, props, children),
    GlassContainer: ({ children, ...props }: { children?: unknown }) =>
      React.createElement(View, props, children),
    isLiquidGlassAvailable: jest.fn(() => false),
    isGlassEffectAPIAvailable: jest.fn(() => false),
  };
});
jest.mock('expo-blur', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    BlurView: ({ children, ...props }: { children?: unknown }) =>
      React.createElement(View, props, children),
  };
});
jest.mock('expo-linear-gradient', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    LinearGradient: ({ children, ...props }: { children?: unknown }) =>
      React.createElement(View, props, children),
  };
});
jest.mock('react-native-reanimated', () => {
  const { FlatList, Image, ScrollView, Text, View } = jest.requireActual('react-native');
  const createLayoutMock = () => {
    const chain: Record<string, () => unknown> = {};
    const self = () => chain;
    for (const method of [
      'duration',
      'delay',
      'springify',
      'damping',
      'stiffness',
      'mass',
      'easing',
      'reduceMotion',
      'dampingRatio',
      'withInitialValues',
    ]) {
      chain[method] = self;
    }
    return chain;
  };
  const layoutAnim = createLayoutMock();
  return {
    __esModule: true,
    default: {
      View,
      Text,
      Image,
      ScrollView,
      FlatList,
      createAnimatedComponent: (Component: unknown) => Component,
    },
    Easing: {
      linear: (t: number) => t,
      cubic: (t: number) => t,
      out: (fn: (t: number) => number) => fn,
      inOut: (fn: (t: number) => number) => fn,
    },
    interpolateColor: (_value: number, _input: number[], output: string[]) =>
      output[output.length - 1] ?? '#9E7F60',
    FadeIn: layoutAnim,
    FadeInDown: layoutAnim,
    FadeInUp: layoutAnim,
    FadeOut: layoutAnim,
    FadeOutUp: layoutAnim,
    LinearTransition: layoutAnim,
    SlideInDown: layoutAnim,
    SlideOutDown: layoutAnim,
    ZoomIn: layoutAnim,
    useReducedMotion: jest.fn(() => false),
    useSharedValue: <T>(initial: T) => {
      const state = {
        value: initial,
        get() {
          return state.value;
        },
        set(next: unknown) {
          state.value =
            typeof next === 'function'
              ? (Reflect.apply(next, undefined, [state.value]) as T)
              : (next as T);
        },
      };
      return state;
    },
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
    withSpring: <T>(toValue: T) => toValue,
    withTiming: <T>(toValue: T) => toValue,
    withDelay: <T>(_delayMs: number, animation: T) => animation,
    withRepeat: <T>(animation: T) => animation,
    withSequence: (...animations: unknown[]) => animations[animations.length - 1],
    interpolate: (value: number, input: number[], output: number[]) => {
      if (!input.length || !output.length) return value;
      const firstIn = input[0] ?? 0;
      const lastIn = input[input.length - 1] ?? firstIn;
      const firstOut = output[0] ?? 0;
      const lastOut = output[output.length - 1] ?? firstOut;
      if (input.length === 1) return firstOut;
      if (value <= firstIn) return firstOut;
      if (value >= lastIn) return lastOut;
      for (let i = 0; i < input.length - 1; i++) {
        const x0 = input[i] ?? firstIn;
        const x1 = input[i + 1] ?? lastIn;
        if (value >= x0 && value <= x1) {
          const y0 = output[i] ?? firstOut;
          const y1 = output[i + 1] ?? lastOut;
          const span = x1 - x0;
          const ratio = span === 0 ? 0 : (value - x0) / span;
          return y0 + ratio * (y1 - y0);
        }
      }
      return firstOut;
    },
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    cancelAnimation: jest.fn(),
  };
});
