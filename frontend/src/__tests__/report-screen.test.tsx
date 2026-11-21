import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import ReportScreen from '@/app/settings/report';
import { i18n } from '@/i18n';

const mockReport = jest.fn();
jest.mock('@/features/safety/api', () => ({
  safetyApi: { report: (...args: unknown[]) => mockReport(...args) },
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ targetType: 'user', targetId: 'other-user' }),
  router: { canGoBack: () => true, back: jest.fn(), replace: jest.fn() },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 44, bottom: 34 }) };
});

const originalOS = Platform.OS;
beforeEach(async () => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  mockReport.mockResolvedValue({ id: 'report-reference', status: 'pending' });
  await i18n.changeLanguage('en');
});
afterEach(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
});

it('shows a field error instead of silently ignoring an empty report', () => {
  const ui = render(<ReportScreen />);
  fireEvent.press(ui.getByRole('button', { name: 'Send report' }));
  expect(ui.getByText(i18n.t('safety.detailsTooShort'))).toBeTruthy();
  expect(mockReport).not.toHaveBeenCalled();
});

it.each(['123456789', '   123456789   ', '😀😀😀😀😀'])(
  'rejects fewer than ten trimmed Unicode characters: %s',
  (details) => {
    const ui = render(<ReportScreen />);
    fireEvent.changeText(ui.getByLabelText('Details'), details);
    expect(ui.getByText(i18n.t('safety.detailsTooShort'))).toBeTruthy();
    fireEvent.press(ui.getByRole('button', { name: 'Send report' }));
    expect(mockReport).not.toHaveBeenCalled();
  },
);

it('clears the length error and submits a valid trimmed report', async () => {
  const ui = render(<ReportScreen />);
  const field = ui.getByLabelText('Details');
  fireEvent.changeText(field, 'short');
  fireEvent.changeText(field, '  1234567890  ');
  expect(ui.queryByText(i18n.t('safety.detailsTooShort'))).toBeNull();
  fireEvent.press(ui.getByRole('button', { name: 'Send report' }));
  await waitFor(() =>
    expect(mockReport).toHaveBeenCalledWith(
      expect.objectContaining({
        target_type: 'user',
        target_id: 'other-user',
        details: '1234567890',
      }),
    ),
  );
  await ui.findByText(/report-reference/);
});

it('lets the iOS scroll view reveal the focused input without double keyboard padding', () => {
  const ui = render(<ReportScreen />);
  expect(ui.UNSAFE_getByType(ScrollView).props.automaticallyAdjustKeyboardInsets).toBe(
    true,
  );
  expect(ui.UNSAFE_getByType(KeyboardAvoidingView).props.enabled).toBe(false);
});
