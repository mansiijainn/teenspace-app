import { StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

// Curated phrases — gentle, not preachy, not therapy-coded
const PHRASES = [
  'you made it through yesterday.\nthat\'s enough.',
  'welcome back.\ntake a breath.',
  'you don\'t have to have it together today.',
  'soft start. no pressure.',
  'whatever today brings,\nyou\'ve got this space.',
  'one moment at a time.\nthat\'s all anyone\'s doing.',
  'glad you\'re here.\neven on the rough days.',
  'today doesn\'t need to be productive\nto matter.',
  'you\'re allowed to just exist today.',
  'come as you are.\nnothing to perform here.',
  'tiny steps still count.',
  'rest is not behind.\nrest is part of it.',
  'feelings are visitors.\nlet them sit, let them pass.',
  'you\'ve survived every hard day so far.\nthat\'s real.',
  'whatever you\'re carrying,\nyou can put it down for a sec.',
];

function pickPhrase() {
  return PHRASES[Math.floor(Math.random() * PHRASES.length)];
}

export default function WelcomeRitual({ onDone }) {
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const { gradient } = useTheme();
  const phrase = useRef(pickPhrase()).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 800,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onDone());
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.center, { opacity: Animated.multiply(fadeIn, fadeOut) }]}>
          <View style={styles.dot} />
          <Text style={styles.phrase}>{phrase}</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  safe:         { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#fff',
    marginBottom: 32,
    opacity: 0.8,
  },
  phrase: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
});