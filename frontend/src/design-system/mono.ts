export const mono = {
  background: '#CFCFCD',
  ink: '#090909',
  paper: '#FFFFFF',
  muted: '#5F5F5D',
  soft: '#E7E7E5',
  line: '#8D8D8B',
  danger: '#A53B34',
} as const;

export const monoShadow = {
  web: { boxShadow: '0px 7px 0px rgba(0, 0, 0, 0.14)' },
  native: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 0,
    elevation: 6,
  },
} as const;
