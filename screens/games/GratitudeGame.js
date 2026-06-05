import { StyleSheet, Text, View, TouchableOpacity, Pressable, Animated, Easing, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState, useRef } from 'react';

const PROMPTS = [
  'name someone who makes you laugh',
  'a small thing that made today better',
  'a place you feel safe',
  'a song that hits different lately',
  'something your body does well',
  'a memory you smile thinking about',
  'a person you\'re glad you met',
  'a moment you felt seen',
  'something you\'re good at, no flex',
  'a kindness someone showed you',
  'something you\'re looking forward to',
  'a comfort food, no shame',
  'a show or movie that healed something',
  'a compliment you got that stuck',
  'something you\'re proud you survived',
  'a smell that brings you back',
  'a friend you should text right now',
  'a meal you remember really enjoying',
  'something easy you take for granted',
  'a tiny win from this week',
];

export default function GratitudeGame({ onClose, gradient = ['#ffd84d', '#ff9a3c'] }) {
  const [phase, setPhase]     = useState('idle');   // idle | spinning | answering | done
  const [prompt, setPrompt]   = useState(null);
  const [answer, setAnswer]   = useState('');
  const [count, setCount]     = useState(0);
  const spin = useRef(new Animated.Value(0)).current;

  const spinWheel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('spinning');
    setAnswer('');

    // Animate full rotations + random extra
    const rotations = 4 + Math.random() * 2;
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: rotations,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      const p = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
      setPrompt(p);
      setPhase('answering');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };

  const submit = () => {
    if (!answer.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newCount = count + 1;
    setCount(newCount);
    if (newCount >= 3) {
      setPhase('done');
    } else {
      setPhase('idle');
      setPrompt(null);
    }
  };

  const skip = () => {
    Haptics.selectionAsync();
    setPhase('idle');
    setPrompt(null);
    setAnswer('');
  };

  const finish = () => {
    setPhase('done');
  };

  const reset = () => {
    setPhase('idle');
    setPrompt(null);
    setAnswer('');
    setCount(0);
  };

  const rotateInterpolate = spin.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ── DONE ──
  if (phase === 'done') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerWrap}>
          <Ionicons name="sunny" size={70} color="#fff" />
          <Text style={styles.bigTitle}>that's the vibe</Text>
          <Text style={styles.doneSub}>
            you noticed {count} good thing{count === 1 ? '' : 's'}.{'\n'}
            small joys, real fuel.
          </Text>
        </View>
        <View style={styles.bottom}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={reset} style={({ pressed }) => [styles.btn, { flex: 1 }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <Text style={styles.btnText}>again</Text>
            </Pressable>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.btn, styles.btnGhost, { flex: 1 }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <Text style={[styles.btnText, { color: '#fff' }]}>done</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── ANSWERING ──
  if (phase === 'answering') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.progress}>{count + 1} / 3</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.answerWrap}>
          <Text style={styles.promptLabel}>your prompt</Text>
          <Text style={styles.promptText}>{prompt}</Text>
          <TextInput
            style={styles.input}
            placeholder="type or just think it"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={answer}
            onChangeText={setAnswer}
            multiline
            maxLength={200}
          />
        </View>
        <View style={styles.bottom}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={skip} style={({ pressed }) => [styles.btn, styles.btnGhost, { flex: 0.5 }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <Text style={[styles.btnText, { color: '#fff' }]}>skip</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={!answer.trim()}
              style={({ pressed }) => [styles.btn, { flex: 1, opacity: answer.trim() ? 1 : 0.5 }, pressed && answer.trim() && { transform: [{ scale: 0.97 }] }]}
            >
              <Text style={styles.btnText}>{count >= 2 ? 'finish' : 'next'}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── IDLE / SPINNING ──
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        {count > 0 && <Text style={styles.progress}>{count} / 3</Text>}
        {count > 0 && <TouchableOpacity onPress={finish}><Text style={styles.skipAll}>finish</Text></TouchableOpacity>}
        {count === 0 && <View style={{ width: 40 }} />}
      </View>

      <View style={styles.centerWrap}>
        <Text style={styles.bigTitle}>gratitude spin</Text>
        <Text style={styles.intro}>spin the wheel. answer the prompt.{'\n'}3 rounds, then you're free.</Text>

        <Animated.View style={[styles.wheel, { transform: [{ rotate: rotateInterpolate }] }]}>
          {/* Pie wedges as colored borders */}
          <View style={[styles.wheelInner]}>
            <Ionicons name="sparkles" size={48} color="#fff" />
          </View>
        </Animated.View>
      </View>

      <View style={styles.bottom}>
        <Pressable
          onPress={spinWheel}
          disabled={phase === 'spinning'}
          style={({ pressed }) => [styles.btn, phase === 'spinning' && { opacity: 0.6 }, pressed && phase !== 'spinning' && { transform: [{ scale: 0.97 }] }]}
        >
          <Text style={styles.btnText}>{phase === 'spinning' ? 'spinning…' : 'spin'}</Text>
        </Pressable>
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
  progress:     { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  skipAll:      { color: '#fff', fontSize: 13, fontWeight: '600' },

  centerWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 12 },
  bigTitle:     { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -0.8 },
  intro:        { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },

  wheel:        {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 6, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 20,
  },
  wheelInner:   {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },

  answerWrap:   { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  promptLabel:  { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  promptText:   { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 34, marginBottom: 24 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },

  doneSub:      { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22, textAlign: 'center' },

  bottom:       { paddingHorizontal: 20, paddingBottom: 20 },
  btn:          { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnGhost:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  btnText:      { color: '#1a0d12', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
});