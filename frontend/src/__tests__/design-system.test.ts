import { colors, spacing } from '@/design-system';

describe('WeDo design system', () => {
  it('exposes the documented monochrome palette and spacing scale', () => {
    expect(colors.background).toBe('#CFCFCD');
    expect(colors.accent).toBe('#090909');
    expect(spacing.screen).toBe(16);
  });
});
