import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
// @ts-ignore
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const MIN_SPLASH_DURATION = 4000;

const SplashScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isLoading } = useAuth(); // ✅ only need isLoading now

  const [animDone, setAnimDone]       = useState(false);
  const [minTimeDone, setMinTimeDone] = useState(false);
  const authDone = !isLoading;

  // Core
  const screenOpacity    = useRef(new Animated.Value(1)).current;
  const bgScale          = useRef(new Animated.Value(0)).current;

  // Logo
  const logoScale        = useRef(new Animated.Value(0)).current;
  const logoPulse        = useRef(new Animated.Value(1)).current;
  const logoGlow         = useRef(new Animated.Value(0)).current;

  // Rings
  const ring1Scale       = useRef(new Animated.Value(0)).current;
  const ring1Opacity     = useRef(new Animated.Value(0)).current;
  const ring2Scale       = useRef(new Animated.Value(0)).current;
  const ring2Opacity     = useRef(new Animated.Value(0)).current;
  const ring3Scale       = useRef(new Animated.Value(0)).current;
  const ring3Opacity     = useRef(new Animated.Value(0)).current;

  // Text
  const appNameTranslate = useRef(new Animated.Value(40)).current;
  const appNameOpacity   = useRef(new Animated.Value(0)).current;
  const taglineTranslate = useRef(new Animated.Value(30)).current;
  const taglineOpacity   = useRef(new Animated.Value(0)).current;

  // Pills
  const pill1Opacity     = useRef(new Animated.Value(0)).current;
  const pill1Translate   = useRef(new Animated.Value(20)).current;
  const pill2Opacity     = useRef(new Animated.Value(0)).current;
  const pill2Translate   = useRef(new Animated.Value(20)).current;
  const pill3Opacity     = useRef(new Animated.Value(0)).current;
  const pill3Translate   = useRef(new Animated.Value(20)).current;

  // Progress & bottom
  const progressWidth    = useRef(new Animated.Value(0)).current;
  const bottomOpacity    = useRef(new Animated.Value(0)).current;

  // Dots
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Minimum time gate
    const minTimer = setTimeout(() => setMinTimeDone(true), MIN_SPLASH_DURATION);

    // 1. BG scale
    Animated.spring(bgScale, {
      toValue: 1, friction: 10, tension: 30, useNativeDriver: true,
    }).start();

    // 2. Logo pop
    Animated.sequence([
      Animated.delay(400),
      Animated.spring(logoScale, {
        toValue: 1, friction: 5, tension: 60, useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoPulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
          Animated.timing(logoPulse, { toValue: 1,    duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    });

    // 3. Glow
    Animated.sequence([
      Animated.delay(800),
      Animated.timing(logoGlow, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]).start();

    // 4. Rings expand then loop
    const ringAnim = (scale: Animated.Value, opacity: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,    duration: 1000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.25, duration: 600,  useNativeDriver: true }),
        ]),
      ]);

    Animated.parallel([
      ringAnim(ring1Scale, ring1Opacity, 600),
      ringAnim(ring2Scale, ring2Opacity, 900),
      ringAnim(ring3Scale, ring3Opacity, 1200),
    ]).start(() => {
      const loopRing = (scale: Animated.Value, opacity: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(scale,   { toValue: 1.15, duration: 1800, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0.08, duration: 1800, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale,   { toValue: 1,    duration: 1800, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0.25, duration: 1800, useNativeDriver: true }),
            ]),
          ])
        );
      loopRing(ring1Scale, ring1Opacity, 0).start();
      loopRing(ring2Scale, ring2Opacity, 500).start();
      loopRing(ring3Scale, ring3Opacity, 1000).start();
    });

    // 5. App name
    Animated.sequence([
      Animated.delay(1100),
      Animated.parallel([
        Animated.spring(appNameTranslate, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
        Animated.timing(appNameOpacity,   { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    // 6. Tagline
    Animated.sequence([
      Animated.delay(1400),
      Animated.parallel([
        Animated.spring(taglineTranslate, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
        Animated.timing(taglineOpacity,   { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    // 7. Pills — setAnimDone after last pill
    ([
      [pill1Opacity, pill1Translate, 1700, false],
      [pill2Opacity, pill2Translate, 1950, false],
      [pill3Opacity, pill3Translate, 2200, true],
    ] as [Animated.Value, Animated.Value, number, boolean][]).forEach(([op, tr, delay, isLast]) => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(tr, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
          Animated.timing(op, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]).start(() => {
        if (isLast) setTimeout(() => setAnimDone(true), 500);
      });
    });

    // 8. Progress bar
    Animated.timing(progressWidth, {
      toValue: width - 80,
      duration: MIN_SPLASH_DURATION,
      useNativeDriver: false,
    }).start();

    // 9. Bottom text
    Animated.sequence([
      Animated.delay(1800),
      Animated.timing(bottomOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();

    // 10. Dots
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1,   duration: 450, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 450, useNativeDriver: true }),
          Animated.delay(800),
        ])
      );
    Animated.parallel([
      pulse(dot1, 0),
      pulse(dot2, 200),
      pulse(dot3, 400),
    ]).start();

    return () => clearTimeout(minTimer);
  }, []);

  // ✅ Navigate only when all 3 gates pass — then let AuthContext handle routing
  useEffect(() => {
    if (authDone && animDone && minTimeDone) {
      Animated.timing(screenOpacity, {
        toValue: 0, duration: 800, useNativeDriver: true,
      }).start(() => {
        navigation.replace('Welcome'); // AuthContext conditional rendering takes over automatically
      });
    }
  }, [authDone, animDone, minTimeDone]);

  const pills = [
    { icon: 'map-marker-radius', label: 'Live Map',   opacity: pill1Opacity, translate: pill1Translate },
    { icon: 'blood-bag',         label: 'Blood Bank', opacity: pill2Opacity, translate: pill2Translate },
    { icon: 'bell-ring',         label: 'SOS Alerts', opacity: pill3Opacity, translate: pill3Translate },
  ];

  return (
    <Animated.View style={[s.root, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" translucent />

      {/* Radial BG */}
      <Animated.View style={[s.bgCircle, { transform: [{ scale: bgScale }] }]} />

      {/* Decorative circles */}
      <View style={s.hc1} />
      <View style={s.hc2} />
      <View style={s.hc3} />
      <View style={s.hc4} />

      {/* Top badge */}
      <View style={[s.topAccent, { paddingTop: insets.top + 16 }]}>
        <Animated.View style={[s.accentBadge, { opacity: bottomOpacity }]}>
          <MaterialCommunityIcons name="hospital-box" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={s.accentTxt}>Charusat Hospital</Text>
        </Animated.View>
      </View>

      {/* Center */}
      <View style={s.center}>

        {/* Rings + Logo */}
        <View style={s.ringsContainer}>
          <Animated.View style={[s.ring, s.ring3, {
            transform: [{ scale: ring3Scale }], opacity: ring3Opacity,
          }]} />
          <Animated.View style={[s.ring, s.ring2, {
            transform: [{ scale: ring2Scale }], opacity: ring2Opacity,
          }]} />
          <Animated.View style={[s.ring, s.ring1, {
            transform: [{ scale: ring1Scale }], opacity: ring1Opacity,
          }]} />

          <Animated.View style={[s.glow, { opacity: logoGlow }]} />

          <Animated.View style={[s.logoCircle, {
            transform: [{ scale: Animated.multiply(logoScale, logoPulse) }],
          }]}>
            <MaterialCommunityIcons name="blood-bag" size={60} color="#C8102E" />
          </Animated.View>
        </View>

        {/* App name */}
        <Animated.Text style={[s.appName, {
          opacity: appNameOpacity,
          transform: [{ translateY: appNameTranslate }],
        }]}>
          Rakt<Text style={s.appNameAccent}>map</Text>
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[s.tagline, {
          opacity: taglineOpacity,
          transform: [{ translateY: taglineTranslate }],
        }]}>
          Save Lives Through Blood Donation
        </Animated.Text>

        {/* Divider */}
        <Animated.View style={[s.divider, { opacity: taglineOpacity }]} />

        {/* Pills */}
        <View style={s.pillsRow}>
          {pills.map(({ icon, label, opacity, translate }) => (
            <Animated.View
              key={label}
              style={[s.pill, { opacity, transform: [{ translateY: translate }] }]}
            >
              <MaterialCommunityIcons name={icon} size={15} color="#C8102E" />
              <Text style={s.pillTxt}>{label}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Bottom */}
      <Animated.View style={[s.bottom, { paddingBottom: insets.bottom + 28, opacity: bottomOpacity }]}>

        {/* Dots / Ready */}
        <View style={s.loadingRow}>
          {(!authDone || !animDone || !minTimeDone) ? (
            [dot1, dot2, dot3].map((dot, i) => (
              <Animated.View key={i} style={[s.loadingDot, { opacity: dot }]} />
            ))
          ) : (
            <View style={s.doneRow}>
              <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.85)" />
              <Text style={s.doneTxt}>Ready</Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: progressWidth }]} />
        </View>

        <Text style={s.bottomTxt}>Powered by Raktmap Pvt Ltd. • Raktmap v1.0</Text>
      </Animated.View>
    </Animated.View>
  );
};

const LOGO_SIZE = 130;
const RING1     = LOGO_SIZE + 50;
const RING2     = LOGO_SIZE + 100;
const RING3     = LOGO_SIZE + 160;

const s = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: '#B00020',
    alignItems: 'center', justifyContent: 'space-between',
  },
  bgCircle: {
    position: 'absolute',
    width: height * 1.2, height: height * 1.2,
    borderRadius: height * 0.6,
    backgroundColor: '#C8102E',
    top: -height * 0.3,
    alignSelf: 'center',
  },
  hc1: {
    position: 'absolute', width: 340, height: 340, borderRadius: 170,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -110, right: -90,
  },
  hc2: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -70, left: -70,
  },
  hc3: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(0,0,0,0.06)', top: '38%', right: -50,
  },
  hc4: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(0,0,0,0.05)', top: '18%', left: -35,
  },
  topAccent: {
    width: '100%', paddingHorizontal: 20, alignItems: 'flex-end',
  },
  accentBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  accentTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
  },
  ringsContainer: {
    width: RING3, height: RING3,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  ring: {
    position: 'absolute', borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  ring1: { width: RING1, height: RING1, borderRadius: RING1 / 2 },
  ring2: { width: RING2, height: RING2, borderRadius: RING2 / 2 },
  ring3: { width: RING3, height: RING3, borderRadius: RING3 / 2 },
  glow: {
    position: 'absolute',
    width: LOGO_SIZE + 30, height: LOGO_SIZE + 30,
    borderRadius: (LOGO_SIZE + 30) / 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  logoCircle: {
    width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: LOGO_SIZE / 2,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 24, elevation: 16,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
  },
  appName: {
    color: '#fff', fontSize: 48, fontWeight: '800',
    letterSpacing: 1.5, marginBottom: 8,
  },
  appNameAccent: { color: 'rgba(255,255,255,0.6)' },
  tagline: {
    color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500',
    textAlign: 'center', lineHeight: 20, marginBottom: 20, letterSpacing: 0.3,
  },
  divider: {
    width: 50, height: 2, borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 24,
  },
  pillsRow: { flexDirection: 'row', gap: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingVertical: 9, paddingHorizontal: 13,
    borderRadius: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  pillTxt: { fontSize: 11, fontWeight: '800', color: '#C8102E' },
  bottom: {
    alignItems: 'center', paddingTop: 8,
    width: '100%', paddingHorizontal: 40,
  },
  loadingRow: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    marginBottom: 14, height: 20,
  },
  loadingDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },
  progressTrack: {
    width: width - 80, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14, overflow: 'hidden',
  },
  progressFill: {
    height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  bottomTxt: {
    color: 'rgba(255,255,255,0.45)', fontSize: 11,
    fontWeight: '500', letterSpacing: 0.2,
  },
});

export default SplashScreen;
