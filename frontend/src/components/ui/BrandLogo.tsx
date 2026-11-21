import { Image, StyleSheet, View } from 'react-native';

// The square source has ample transparent space around the wordmark.
// Keep its aspect ratio and frame the visible brand at the intended size.
export function BrandLogo() {
  return (
    <View accessible accessibilityLabel="WeDo" style={styles.frame}>
      <Image
        source={require('../../../assets/TekLogo.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 150,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: 150, height: 150, flexShrink: 0 },
});
