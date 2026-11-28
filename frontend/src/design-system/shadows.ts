import { Platform, type ViewStyle } from 'react-native';

const cardShadow: ViewStyle =
  Platform.OS === 'web'
    ? { boxShadow: '0px 10px 28px rgba(28, 22, 16, 0.06)' }
    : {
        shadowColor: '#1C1610',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
        elevation: 4,
      };

const elevatedShadow: ViewStyle =
  Platform.OS === 'web'
    ? { boxShadow: '0px 14px 34px rgba(28, 22, 16, 0.09)' }
    : {
        shadowColor: '#1C1610',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.09,
        shadowRadius: 24,
        elevation: 7,
      };

const glassShadow: ViewStyle =
  Platform.OS === 'web'
    ? { boxShadow: '0px 8px 20px rgba(28, 22, 16, 0.05)' }
    : {
        shadowColor: '#1C1610',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 14,
        elevation: 3,
      };

const pillActionShadow: ViewStyle =
  Platform.OS === 'web'
    ? { boxShadow: '0px 8px 20px rgba(17, 17, 16, 0.16)' }
    : {
        shadowColor: '#111110',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
        elevation: 5,
      };

export const shadows = {
  card: cardShadow,
  elevated: elevatedShadow,
  glass: glassShadow,
  pillAction: pillActionShadow,
} as const;
