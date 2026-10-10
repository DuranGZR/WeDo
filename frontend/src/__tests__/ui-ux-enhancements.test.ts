import { haptic } from '@/lib/haptics';

describe('UI/UX Enhancements & Haptics', () => {
  it('exposes safe haptic trigger methods for native and fallback environments', () => {
    expect(() => haptic.trigger('light')).not.toThrow();
    expect(() => haptic.trigger('medium')).not.toThrow();
    expect(() => haptic.trigger('heavy')).not.toThrow();
    expect(() => haptic.trigger('selection')).not.toThrow();
    expect(() => haptic.trigger('success')).not.toThrow();
    expect(() => haptic.trigger('warning')).not.toThrow();
    expect(() => haptic.trigger('error')).not.toThrow();
    expect(() => haptic.trigger('none')).not.toThrow();
  });
});
