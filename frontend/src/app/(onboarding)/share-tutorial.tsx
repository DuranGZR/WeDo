import { router } from 'expo-router';
import { StyleSheet, View, Image, Platform, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Screen } from '@/components/ui';
import { colors, spacing, radius } from '@/design-system';

const { width } = Dimensions.get('window');

export default function ShareTutorialScreen() {
  return (
    <Screen scroll={true}>
      {/* Ambient Glow Background Blobs */}
      <View style={styles.ambientContainer} pointerEvents="none">
        <View style={styles.blobCoral} />
        <View style={styles.blobSand} />
      </View>

      {/* Header Bar with Back Button */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Geri git"
        >
          <Ionicons name="arrow-back" size={22} color={colors.primaryText} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.header}>
          <AppText variant="largeTitle" style={styles.title}>
            Gördüğün her şeyi WeDo’ya kaydet
          </AppText>
          <AppText muted style={styles.subtitle}>
            İnternette dolaşırken beğendiğin her şeyi 3 basit adımda ortak alanına
            aktarabilirsin.
          </AppText>
        </View>

        {/* Steps Cards */}
        <View style={styles.stepsContainer}>
          {/* Step 1: Paylaş'a dokun */}
          <Card style={styles.stepCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepBadge}>
                <AppText variant="caption" style={styles.stepBadgeText}>
                  ADIM 1
                </AppText>
              </View>
              <AppText variant="cardTitle" style={styles.stepTitle}>
                Paylaş’a dokun
              </AppText>
            </View>
            <AppText muted style={styles.stepDescription}>
              Instagram, TikTok veya tarayıcında gezinirken beğendiğin içeriğin altındaki
              paylaşım menüsünü aç.
            </AppText>

            {/* Mock Visual: Social Badges */}
            <View style={styles.socialRow}>
              <View style={[styles.socialIconBadge, { backgroundColor: '#FDF2F4' }]}>
                <Ionicons name="logo-instagram" size={16} color="#E1306C" />
                <AppText
                  variant="caption"
                  style={[styles.socialText, { color: '#E1306C' }]}
                >
                  Instagram
                </AppText>
              </View>
              <View style={[styles.socialIconBadge, { backgroundColor: '#F5F5F5' }]}>
                <Ionicons name="logo-tiktok" size={16} color="#000000" />
                <AppText
                  variant="caption"
                  style={[styles.socialText, { color: '#000000' }]}
                >
                  TikTok
                </AppText>
              </View>
              <View style={[styles.socialIconBadge, { backgroundColor: '#EBF7FF' }]}>
                <Ionicons name="globe-outline" size={16} color="#0288D1" />
                <AppText
                  variant="caption"
                  style={[styles.socialText, { color: '#0288D1' }]}
                >
                  Web
                </AppText>
              </View>
              <View style={styles.shareIndicator}>
                <Ionicons name="share-outline" size={15} color={colors.accent} />
              </View>
            </View>
          </Card>

          {/* Step 2: WeDo'yu seç */}
          <Card style={styles.stepCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepBadge}>
                <AppText variant="caption" style={styles.stepBadgeText}>
                  ADIM 2
                </AppText>
              </View>
              <AppText variant="cardTitle" style={styles.stepTitle}>
                WeDo’yu seç
              </AppText>
            </View>
            <AppText muted style={styles.stepDescription}>
              Açılan paylaşım listesinden WeDo’yu bul ve dokun.
            </AppText>

            {/* Mock Visual: Share Sheet */}
            <View style={styles.shareSheetMock}>
              <View style={styles.shareSheetItem}>
                <View style={styles.mockAppIconPlaceholder}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={colors.secondaryText}
                  />
                </View>
                <AppText variant="caption" muted style={styles.mockAppName}>
                  Mesajlar
                </AppText>
              </View>
              <View style={[styles.shareSheetItem, styles.activeShareItem]}>
                <View style={styles.weDoIconContainer}>
                  <Image
                    source={require('../../../assets/TekLogo.png')}
                    style={styles.weDoLogoIcon}
                    resizeMode="contain"
                  />
                </View>
                <AppText variant="caption" style={styles.weDoAppName}>
                  WeDo
                </AppText>
                <View style={styles.pingGlow} />
              </View>
              <View style={styles.shareSheetItem}>
                <View style={styles.mockAppIconPlaceholder}>
                  <Ionicons name="mail-outline" size={18} color={colors.secondaryText} />
                </View>
                <AppText variant="caption" muted style={styles.mockAppName}>
                  Posta
                </AppText>
              </View>
              <View style={styles.shareSheetItem}>
                <View style={styles.mockAppIconPlaceholder}>
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={18}
                    color={colors.secondaryText}
                  />
                </View>
                <AppText variant="caption" muted style={styles.mockAppName}>
                  Daha Fazla
                </AppText>
              </View>
            </View>
          </Card>

          {/* Step 3: Listeyi belirle */}
          <Card style={styles.stepCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepBadge}>
                <AppText variant="caption" style={styles.stepBadgeText}>
                  ADIM 3
                </AppText>
              </View>
              <AppText variant="cardTitle" style={styles.stepTitle}>
                Listeyi belirle
              </AppText>
            </View>
            <AppText muted style={styles.stepDescription}>
              İçeriğin kaydedileceği ortak listeyi seç, hepsi bu kadar!
            </AppText>

            {/* Mock Visual: Destination List */}
            <View style={styles.listsMock}>
              <View style={styles.mockListItem}>
                <View style={styles.mockListIcon}>
                  <AppText style={styles.emojiIcon}>🍝</AppText>
                </View>
                <AppText variant="secondary" style={styles.mockListText}>
                  Akşam Yemeği
                </AppText>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.tertiaryText}
                  style={{ marginLeft: 'auto' }}
                />
              </View>
              <View style={[styles.mockListItem, styles.mockListItemSelected]}>
                <View style={styles.mockListIcon}>
                  <AppText style={styles.emojiIcon}>✈️</AppText>
                </View>
                <AppText
                  variant="secondary"
                  style={[styles.mockListText, { fontWeight: '600' }]}
                >
                  Haftasonu Kaçamağı
                </AppText>
                <View style={styles.mockCheck}>
                  <Ionicons name="checkmark" size={12} color={colors.surface} />
                </View>
              </View>
              <View style={styles.mockListItem}>
                <View style={styles.mockListIcon}>
                  <AppText style={styles.emojiIcon}>🍿</AppText>
                </View>
                <AppText variant="secondary" style={styles.mockListText}>
                  Filmler
                </AppText>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.tertiaryText}
                  style={{ marginLeft: 'auto' }}
                />
              </View>
            </View>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Nasıl çalıştığını gördüm"
          >
            <AppText style={styles.primaryBtnText}>Nasıl çalıştığını gördüm</AppText>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.surface}
              style={styles.btnIcon}
            />
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Daha sonra"
          >
            <AppText style={styles.secondaryBtnText}>Daha sonra</AppText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  ambientContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  blobCoral: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.accent,
    opacity: 0.08,
    ...Platform.select({
      web: { filter: 'blur(75px)' },
    }),
  },
  blobSand: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#A5A29B',
    opacity: 0.1,
    ...Platform.select({
      web: { filter: 'blur(85px)' },
    }),
  },
  headerBar: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: Platform.OS === 'ios' ? 0 : spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...Platform.select({
      web: { backdropFilter: 'blur(10px)' },
    }),
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.huge,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: width > 400 ? 26 : 22,
    lineHeight: width > 400 ? 32 : 28,
    fontWeight: '800',
    color: colors.primaryText,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondaryText,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  stepsContainer: {
    gap: spacing.md,
  },
  stepCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryText,
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0px 8px 24px rgba(20, 20, 18, 0.04)',
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  stepBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  stepBadgeText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  stepTitle: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 16,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.secondaryText,
    marginBottom: spacing.md,
  },
  // Step 1 mock: Social badging
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialIconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  socialText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },
  shareIndicator: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Step 2 mock: iOS/Android Share Sheet mock
  shareSheetMock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareSheetItem: {
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  activeShareItem: {
    transform: [{ scale: 1.05 }],
  },
  mockAppIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(20, 20, 18, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weDoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(200, 103, 75, 0.25)',
      },
      default: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
  weDoLogoIcon: {
    width: 28,
    height: 28,
  },
  mockAppName: {
    fontSize: 10,
    fontWeight: '500',
  },
  weDoAppName: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
  },
  pingGlow: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  // Step 3 mock: Destination list selector
  listsMock: {
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mockListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mockListItemSelected: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(200, 103, 75, 0.15)',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(20, 20, 18, 0.03)',
      },
    }),
  },
  mockListIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  emojiIcon: {
    fontSize: 14,
  },
  mockListText: {
    fontSize: 13,
    color: colors.primaryText,
  },
  mockCheck: {
    marginLeft: 'auto',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Actions
  actions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    minHeight: 52,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 16px rgba(200, 103, 75, 0.2)',
        transition: 'all 0.2s ease',
      },
      default: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnIcon: {
    marginTop: 1,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease',
      },
    }),
  },
  secondaryBtnText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
