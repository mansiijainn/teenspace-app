import { StyleSheet, Text, View, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useRef } from 'react';

const { width } = Dimensions.get('window');

// 8 unique icons → 16 cards total (8 pairs), 4×4 grid
const ICONS = [
  { name: 'sunny',        color: '#ffd84d' },
  { name: 'moon',         color: '#c4a8ff' },
  { name: 'flower',       color: '#ff9eb5' },
  { name: 'leaf',         color: '#7ed4ad' },
  { name: 'cloud',        color: '#a8c8ff' },
  { name: 'flash',        color: '#ffb547' },
  { name: 'snow',         color: '#aae0ff' },
  { name: 'heart',        color: '#ff7a9e' },
];

const COLS = 4;
const PAD  = 20;
const GAP  = 8;
const CARD = (width - PAD * 2 - GAP * (COLS - 1)) / COLS;

function buildDeck() {
  const pairs = ICONS.flatMap((icon, i) => [
    { id: `${i}-a`, iconName: icon.name, color: icon.color, pairId: i },
    { id: `${i}-b`, iconName: icon.name, color: icon.color, pairId: i },
  ]);
  return pairs.sort(() => Math.random() - 0.5);
}

export default function MemoryGame({ onClose, gradient = ['#ffb547', '#ff7a3c'] }) {
  const [deck, setDeck]         = useState(() => buildDeck());
  const [flipped, setFlipped]   = useState([]);   // ids currently face-up
  const [matched, setMatched]   = useState([]);   // pairIds that have been matched
  const [moves, setMoves]       = useState(0);
  const [done, setDone]         = useState(false);
  const lockRef = useRef(false);
  const flippedRef = useRef([]);
  const matchedRef = useRef([]);

  const restart = () => {
    setDeck(buildDeck());
    flippedRef.current = [];
    matchedRef.current = [];
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setDone(false);
    lockRef.current = false;
  };

  const handleFlip = (card) => {
    const currentFlipped = flippedRef.current;
    const currentMatched = matchedRef.current;

    if (lockRef.current || currentFlipped.length >= 2) return;
    if (currentFlipped.includes(card.id)) return;
    if (currentMatched.includes(card.pairId)) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newFlipped = [...currentFlipped, card.id];
    flippedRef.current = newFlipped;
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      setMoves(m => m + 1);
      const [aId, bId] = newFlipped;
      const a = deck.find(c => c.id === aId);
      const b = deck.find(c => c.id === bId);

      if (!a || !b) {
        flippedRef.current = [];
        setFlipped([]);
        lockRef.current = false;
        return;
      }

      if (a.pairId === b.pairId) {
        // match
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setMatched(m => {
            const next = m.includes(a.pairId) ? m : [...m, a.pairId];
            matchedRef.current = next;
            if (next.length === ICONS.length) {
              setDone(true);
            }
            return next;
          });
          flippedRef.current = [];
          setFlipped([]);
          lockRef.current = false;
        }, 400);
      } else {
        // no match
        setTimeout(() => {
          flippedRef.current = [];
          setFlipped([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  if (done) {
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
          <Ionicons name="checkmark-circle" size={70} color="#fff" />
          <Text style={styles.bigTitle}>matched 'em all</Text>
          <Text style={styles.doneSub}>solved in {moves} moves</Text>
        </View>
        <View style={styles.bottom}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={restart} style={({ pressed }) => [styles.btn, { flex: 1 }, pressed && { transform: [{ scale: 0.97 }] }]}>
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>memory match</Text>
          <Text style={styles.subtitle}>{matched.length}/{ICONS.length} matched · {moves} moves</Text>
        </View>
        <TouchableOpacity onPress={restart} style={styles.closeBtn}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {deck.map(card => {
          const isOpen = flipped.includes(card.id) || matched.includes(card.pairId);
          const isMatched = matched.includes(card.pairId);
          return (
            <Pressable
              key={card.id}
              onPress={() => handleFlip(card)}
              disabled={lockRef.current || isOpen}
              style={[
                styles.card,
                {
                  backgroundColor: isOpen ? '#fff' : 'rgba(255,255,255,0.18)',
                  borderColor: isOpen ? card.color : 'rgba(255,255,255,0.3)',
                  opacity: isMatched ? 0.5 : 1,
                },
              ]}
            >
              {isOpen ? (
                <Ionicons name={card.iconName} size={32} color={card.color} />
              ) : (
                <Ionicons name="help" size={24} color="rgba(255,255,255,0.4)" />
              )}
            </Pressable>
          );
        })}
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
    paddingBottom: 20,
  },
  closeBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title:        { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  subtitle:     { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: PAD, justifyContent: 'center' },
  card: {
    width: CARD, height: CARD, borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },

  centerWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 12 },
  bigTitle:     { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginTop: 12 },
  doneSub:      { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22, textAlign: 'center' },

  bottom:       { paddingHorizontal: 20, paddingBottom: 20 },
  btn:          { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnGhost:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  btnText:      { color: '#1a0d12', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
});
