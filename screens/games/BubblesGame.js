import { StyleSheet, Text, View, TouchableOpacity, Pressable, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState, useRef, useMemo } from 'react';

const { width } = Dimensions.get('window');
const COLS    = 6;
const PADDING = 20;
const GAP     = 8;
const SIZE    = (width - PADDING * 2 - GAP * (COLS - 1)) / COLS;
const ROWS_PER_SHEET = 12;

function Bubble({ onPop }) {
  const [popped, setPopped] = useState(false);
  const scale  = useRef(new Animated.Value(1)).current;

  const handle = () => {
    if (popped) return;
    setPopped(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0,   duration: 120, useNativeDriver: true }),
    ]).start(() => onPop?.());
  };

  return (
    <Pressable onPress={handle} style={styles.bubbleWrap}>
      <Animated.View style={[styles.bubble, { transform: [{ scale }] }, popped && styles.bubblePopped]}>
        {!popped && <View style={styles.bubbleShine} />}
      </Animated.View>
    </Pressable>
  );
}

export default function BubblesGame({ onClose, gradient = ['#ff9670', '#ff4e7a'] }) {
  const [sheet, setSheet] = useState(0);
  const [popped, setPopped] = useState(0);

  // Generate keys for each bubble; sheet changes → new keys → new bubbles
  const bubbles = useMemo(
    () => Array.from({ length: COLS * ROWS_PER_SHEET }, (_, i) => `${sheet}-${i}`),
    [sheet]
  );

  const onPop = () => {
    setPopped(p => {
      const next = p + 1;
      // When 80% popped, queue a new sheet
      if (next >= COLS * ROWS_PER_SHEET * 0.8) {
        setTimeout(() => {
          setSheet(s => s + 1);
          setPopped(0);
        }, 400);
      }
      return next;
    });
  };

  const newSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSheet(s => s + 1);
    setPopped(0);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>pop the bubbles</Text>
          <Text style={styles.subtitle}>{popped} popped · sheet {sheet + 1}</Text>
        </View>
        <TouchableOpacity onPress={newSheet} style={styles.closeBtn}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {bubbles.map(key => (
          <Bubble key={key} onPop={onPop} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  closeBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title:        { color: '#fff', fontSize: 16, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  subtitle:     { color: 'rgba(255,255,255,0.8)', fontSize: 11, textAlign: 'center', marginTop: 2 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: PADDING,
    justifyContent: 'center',
  },
  bubbleWrap:   { width: SIZE, height: SIZE },
  bubble: {
    width: SIZE, height: SIZE, borderRadius: SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  bubblePopped: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  bubbleShine: {
    position: 'absolute',
    top: 4, left: 6,
    width: SIZE * 0.3, height: SIZE * 0.3,
    borderRadius: SIZE,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});