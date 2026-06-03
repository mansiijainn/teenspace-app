import { StyleSheet, Text, View, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useRef } from 'react';

const COLORS = [
  { name: 'red',    hex: '#ff5e5e' },
  { name: 'blue',   hex: '#5e9eff' },
  { name: 'green',  hex: '#5edc8a' },
  { name: 'yellow', hex: '#ffd84d' },
  { name: 'pink',   hex: '#ff7ab8' },
  { name: 'purple', hex: '#b878ff' },
];

const ROUND_TIME = 30; // seconds

function randomWord() {
  const word = COLORS[Math.floor(Math.random() * COLORS.length)];
  // 70% chance color ≠ word (the hard case)
  let color;
  do {
    color = COLORS[Math.floor(Math.random() * COLORS.length)];
  } while (Math.random() < 0.7 && color.name === word.name);
  return { word, color };
}

function shuffledOptions(correctName) {
  const others = COLORS.filter(c => c.name !== correctName);
  // pick 3 random others + the correct one
  const picks = [];
  while (picks.length < 3) {
    const c = others[Math.floor(Math.random() * others.length)];
    if (!picks.find(p => p.name === c.name)) picks.push(c);
  }
  const correct = COLORS.find(c => c.name === correctName);
  return [...picks, correct].sort(() => Math.random() - 0.5);
}

export default function ColorMatchGame({ onClose, gradient = ['#7eb4ff', '#5e8aff'] }) {
  const [phase, setPhase]       = useState('intro'); // intro | playing | done
  const [round, setRound]       = useState(null);
  const [options, setOptions]   = useState([]);
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [bestStreak, setBest]   = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [feedback, setFeedback] = useState(null); // 'right' | 'wrong' | null

  const timerRef = useRef(null);

  const newRound = () => {
    const r = randomWord();
    setRound(r);
    setOptions(shuffledOptions(r.color.name));
    setFeedback(null);
  };

  const start = () => {
    setScore(0);
    setStreak(0);
    setBest(0);
    setTimeLeft(ROUND_TIME);
    const r = randomWord();
    setRound(r);
    setOptions(shuffledOptions(r.color.name));
    setFeedback(null);
    setPhase('playing');
  };

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('done');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const onTap = (color) => {
    if (!round || feedback) return;
    const correct = color.name === round.color.name;
    if (correct) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setScore(s => s + 1);
      setStreak(s => {
        const n = s + 1;
        setBest(b => Math.max(b, n));
        return n;
      });
      setFeedback('right');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStreak(0);
      setFeedback('wrong');
    }
    setTimeout(() => newRound(), 300);
  };

  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.introWrap}>
          <Text style={styles.bigTitle}>color match</Text>
          <Text style={styles.introSub}>
            tap the <Text style={{ fontWeight: '800' }}>color</Text> of the word.{'\n'}
            not what the word says.
          </Text>
          <View style={styles.exampleBox}>
            <Text style={[styles.exampleWord, { color: '#5e9eff' }]}>RED</Text>
            <Text style={styles.exampleHint}>tap blue, not red</Text>
          </View>
          <Text style={styles.introNote}>30 seconds. how many can you get?</Text>
        </View>
        <View style={styles.bottom}>
          <Pressable onPress={start} style={({ pressed }) => [styles.actionBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Text style={styles.actionText}>start</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'done') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.introWrap}>
          <Text style={styles.bigTitle}>nice run</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{score}</Text>
              <Text style={styles.statLabel}>correct</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{bestStreak}</Text>
              <Text style={styles.statLabel}>best streak</Text>
            </View>
          </View>
        </View>
        <View style={styles.bottom}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={start} style={({ pressed }) => [styles.actionBtn, { flex: 1 }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <Text style={styles.actionText}>again</Text>
            </Pressable>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.actionBtn, styles.actionBtnGhost, { flex: 1 }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <Text style={[styles.actionText, { color: '#fff' }]}>done</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Playing
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.scoreBar}>
          <Text style={styles.scoreLabel}>score</Text>
          <Text style={styles.scoreNum}>{score}</Text>
        </View>
        <View style={styles.timerBox}>
          <Text style={styles.timerNum}>{timeLeft}s</Text>
        </View>
      </View>

      <View style={styles.wordWrap}>
        {streak >= 3 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={14} color="#fff" />
            <Text style={styles.streakText}>{streak} streak</Text>
          </View>
        )}
        <Text
          style={[
            styles.word,
            { color: round?.color.hex },
            feedback === 'right' && { opacity: 0.5 },
            feedback === 'wrong' && { opacity: 0.3 },
          ]}
        >
          {round?.word.name.toUpperCase()}
        </Text>
      </View>

      <View style={styles.optionsGrid}>
        {options.map(c => (
          <Pressable
            key={c.name}
            onPress={() => onTap(c)}
            style={({ pressed }) => [styles.optionBtn, { backgroundColor: c.hex }, pressed && { transform: [{ scale: 0.95 }] }]}
          >
            <Text style={styles.optionText}>{c.name}</Text>
          </Pressable>
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
  },
  closeBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  scoreBar:     { alignItems: 'center' },
  scoreLabel:   { color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700' },
  scoreNum:     { color: '#fff', fontSize: 22, fontWeight: '900' },
  timerBox:     { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, minWidth: 50, alignItems: 'center' },
  timerNum:     { color: '#fff', fontWeight: '800', fontSize: 14 },

  wordWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  word:         { fontSize: 64, fontWeight: '900', letterSpacing: -2 },
  streakBadge:  { position: 'absolute', top: 30, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  streakText:   { color: '#fff', fontSize: 12, fontWeight: '800' },

  optionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, paddingBottom: 24, justifyContent: 'center' },
  optionBtn:    { width: '47%', paddingVertical: 22, borderRadius: 18, alignItems: 'center' },
  optionText:   { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3, textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

  introWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 12 },
  bigTitle:     { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -1, marginBottom: 8 },
  introSub:     { color: 'rgba(255,255,255,0.9)', fontSize: 16, lineHeight: 24, textAlign: 'center' },
  exampleBox:   { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 24, alignItems: 'center', marginTop: 16, gap: 6 },
  exampleWord:  { fontSize: 40, fontWeight: '900' },
  exampleHint:  { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  introNote:    { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 16 },

  statsGrid:    { flexDirection: 'row', gap: 12, marginTop: 16 },
  statBox:      { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18, paddingVertical: 20, paddingHorizontal: 28, alignItems: 'center', minWidth: 120 },
  statNum:      { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -1 },
  statLabel:    { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },

  bottom:       { paddingHorizontal: 20, paddingBottom: 20 },
  actionBtn:    { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  actionBtnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  actionText:   { color: '#1a0d12', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
});