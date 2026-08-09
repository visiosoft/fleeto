import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../config/theme';

const { width } = Dimensions.get('window');

/**
 * Branded launch screen shown while fonts load and the stored session is restored.
 * Uses the same deep purple gradient as the dashboard's revenue card.
 */
const SplashScreen: React.FC<{ message?: string; fontsReady?: boolean }> = ({ message, fontsReady = true }) => {
  // Before useFonts resolves, referencing a custom family would not render,
  // so fall back to the system font for that first frame.
  const brand = fontsReady ? { fontFamily: fonts.bold } : { fontWeight: '700' as const };
  const label = fontsReady ? { fontFamily: fonts.medium } : {};
  const body = fontsReady ? { fontFamily: fonts.regular } : {};
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.9)).current;
  const dotProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();

    // Slow breathing halo behind the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, { toValue: 1.15, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 0.9, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Loading dots
    Animated.loop(
      Animated.timing(dotProgress, { toValue: 3, duration: 1200, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [logoScale, logoOpacity, textOpacity, ringScale, dotProgress]);

  const dotStyle = (index: number) => ({
    opacity: dotProgress.interpolate({
      inputRange: [index - 0.5, index, index + 0.5, index + 1],
      outputRange: [0.25, 1, 0.25, 0.25],
      extrapolate: 'clamp' as const,
    }),
  });

  return (
    <LinearGradient
      colors={['#1A0B33', '#2D1259', '#4A1FA0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Soft background shapes, echoing the dashboard cards */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <View style={styles.center}>
        <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }] }]} />
        <Animated.View style={[styles.logoBox, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Icon name="truck-fast-outline" size={44} color="#FFFFFF" />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
          <Text style={[styles.title, brand]}>FleetOZ</Text>
          <View style={styles.rule} />
          <Text style={[styles.tagline, label]}>FLEET &amp; TRANSPORT MANAGEMENT</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} style={[styles.dot, dotStyle(i)]} />
          ))}
        </View>
        <Text style={[styles.footerText, body]}>{message || 'Loading your fleet'}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  glowTopRight: {
    position: 'absolute', top: -width * 0.3, right: -width * 0.25,
    width: width * 0.9, height: width * 0.9, borderRadius: width * 0.45,
    backgroundColor: 'rgba(124,77,255,0.16)',
  },
  glowBottomLeft: {
    position: 'absolute', bottom: -width * 0.35, left: -width * 0.3,
    width: width * 0.85, height: width * 0.85, borderRadius: width * 0.43,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  center: { alignItems: 'center' },
  ring: {
    position: 'absolute', top: -18,
    width: 132, height: 132, borderRadius: 66,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logoBox: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 26,
  },
  title: { fontSize: 36, color: '#FFFFFF', letterSpacing: -0.8 },
  rule: {
    width: 44, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)', marginVertical: 12,
  },
  tagline: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)', letterSpacing: 3, textAlign: 'center',
  },
  footer: { position: 'absolute', bottom: 56, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 7, marginBottom: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' },
  footerText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
});

export default SplashScreen;
