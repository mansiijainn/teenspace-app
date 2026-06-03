import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useRef } from 'react';

// Box breathing: 4s inhale → 4s hold → 4s exhale → 4s hold
const PHASES = [
  { label: 'breathe in',  duration: 4000, scale: 1.7 },
  { label: 'hold',        duration: 4000, scale: 1.7 },
  { label: 'breathe out', duration: 4000, scale: 1.0 },
  { label: 'hold',        duration: 4000, scale: 1.0 },
];

const DEFAULT_CYCLES = 4;

export default function BreatheGame({ onClose, gradient = ['#7ed4ad', '#4fbf94'] }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle]       = useState(1);
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const phaseRef  = useRef(0);
  const cycleRef  = useRef(1);
  const stopRef   = useRef(false);

  const runPhase = (idx) => {
    if (stopRef.current) return;
    const phase = PHASES[idx];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(scale, {
      toValue: phase.scale,
      duration: phase.duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || stopRef.current) return;

      const next = (idx + 1) % PHASES.length;
      phaseRef.current = next;
      setPhaseIdx(next);

      if (next === 0) {
        cycleRef.current += 1;
        if (cycleRef.current > DEFAULT_CYCLES) {
          finish();
          return;
        }
        setCycle(cycleRef.current);
      }
      runPhase(next);
    });
  };

  const start = () => {
    stopRef.current = false;
    setDone(false);
    setRunning(true);
    phaseRef.current = 0;
    cycleRef.current = 1;
    setPhaseIdx(0);
    setCycle(1);
    runPhase(0);
  };

  const stop = () => {
    stopRef.current = true;
    scale.stopAnimation();
    setRunning(false);
  };

  const finish = () => {
    stopRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRunning(false);
    setDone(true);
  };

  useEffect(() => {
    return () => { stopRef.current = true; scale.stopAnimation(); };
  }, []);

  const currentPhase = PHASES[phaseIdx];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      {/* Close */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { stop(); onClose(); }} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.cycleText}>
          {running ? `${cycle} / ${DEFAULT_CYCLES}` : ''}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Center */}
      <View style={styles.center}>
        <View style={styles.circleWrap}>
          <Animated.View style={[styles.circle, { transform: [{ scale }] }]}>
            <Animated.View style={[styles.circleInner, { transform: [{ scale: 0.85 }] }]} />
          </Animated.View>
        </View>

        <View style={styles.labelWrap}>
          {done ? (
            <>
              <Text style={styles.doneTitle}>nicely done</Text>
              <Text style={styles.doneSub}>that was {DEFAULT_CYCLES} full cycles. how do you feel?</Text>
            </>
          ) : running ? (
            <Text style={styles.phaseLabel}>{currentPhase.label}</Text>
          ) : (
            <>
              <Text style={styles.introTitle}>box breathing</Text>
              <Text style={styles.introSub}>
                slow your breath, slow your nervous system.{'\n'}
                {DEFAULT_CYCLES} rounds. takes about a minute.
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Bottom button */}
      <View style={styles.bottom}>
        {!running && !done && (
          <Pressable onPress={start} style={({ pressed }) => [styles.actionBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Text style={styles.actionText}>begin</Text>
          </Pressable>
        )}
        {running && (
          <Pressable onPress={stop} style={({ pressed }) => [styles.actionBtn, styles.actionBtnGhost, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Text style={[styles.actionText, { color: '#fff' }]}>stop</Text>
          </Pressable>
        )}
        {done && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={start} style={({ pressed }) => [styles.actionBtn, { flex: 1 }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <Text style={styles.actionText}>again</Text>
            </Pressable>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.actionBtn, styles.actionBtnGhost, { flex: 1 }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <Text style={[styles.actionText, { color: '#fff' }]}>done</Text>
            </Pressable>
          </View>
        )}
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
  },
  closeBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  cycleText:    { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  circleWrap:   { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  circle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  circleInner: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  labelWrap:    { marginTop: 60, alignItems: 'center', minHeight: 80 },
  phaseLabel:   { color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },

  introTitle:   { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.8, marginBottom: 12 },
  introSub:     { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22, textAlign: 'center' },

  doneTitle:    { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  doneSub:      { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22, textAlign: 'center' },

  bottom:       { paddingHorizontal: 20, paddingBottom: 20 },
  actionBtn: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionBtnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  actionText:   { color: '#1a0d12', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
});