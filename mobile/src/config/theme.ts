export const colors = {
  primary: '#2D1B69',
  primaryDark: '#1E1145',
  primaryLight: '#4A3587',
  accent: '#F5A623',
  accentLight: '#FFF3E0',
  secondary: '#F5A623',
  secondaryDark: '#E09500',
  success: '#34C759',
  successLight: '#E8F9EE',
  warning: '#F5A623',
  warningLight: '#FFF8EC',
  error: '#FF3B30',
  errorLight: '#FFEBEA',
  info: '#5856D6',
  background: '#F7F6F3',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E8E6E1',
  divider: '#F0EEED',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  purple: '#2D1B69',
  purpleLight: '#F0ECF9',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  full: 9999,
};

// Dark purple gradient used on hero cards (top-left → bottom-right)
export const gradients = {
  primary: ['#5B3FA8', '#3A2380', '#2D1B69'] as const,
  primaryDeep: ['#4A3587', '#2D1B69', '#1E1145'] as const,
};

// Glassmorphism surface for use on top of gradient backgrounds
export const glass = {
  backgroundColor: 'rgba(255,255,255,0.10)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.14)',
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 32,
};

// Headings (bold/extraBold) use Bricolage Grotesque; labels & body use Plus Jakarta Sans
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
  extraBold: 'BricolageGrotesque_800ExtraBold',
};

export const shadows = {
  sm: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
};
