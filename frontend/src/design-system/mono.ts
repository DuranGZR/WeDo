import { colors } from './colors';
import { shadows } from './shadows';

export const mono = {
  background: colors.background,
  ink: colors.primaryText,
  paper: colors.surface,
  card: colors.surfaceCard,
  muted: colors.secondaryText,
  subtle: colors.tertiaryText,
  soft: colors.surfaceSecondary,
  line: colors.border,
  danger: colors.error,
} as const;

export const monoShadow = {
  web: { boxShadow: '0px 10px 28px rgba(28, 22, 16, 0.06)' },
  native: shadows.card,
} as const;
