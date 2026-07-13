import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

import BreatheGame from './games/BreatheGame';
import ColorMatchGame from './games/ColorMatchGame';
import BubblesGame from './games/BubblesGame';
import GroundingGame from './games/GroundingGame';
import MemoryGame from './games/MemoryGame';
import GratitudeGame from './games/GratitudeGame';

const Placeholder = () => null;

const GAMES = [
  {
    id: 'breathe',
    title: 'breathe',
    subtitle: 'guided breathwork',
    desc: 'slow it down. in for 4, hold, out for 4.',
    icon: 'leaf-outline',
    duration: '1 min',
    mood: 'calm',
    gradient: ['#c9dfc0', '#9ebd8f'],
    Component: BreatheGame,
  },
  {
    id: 'color',
    title: 'color match',
    subtitle: 'focus exercise',
    desc: 'tap the color, not the word. sounds easy. it\'s not.',
    icon: 'color-palette-outline',
    duration: '2 min',
    mood: 'focus',
    gradient: ['#c9dcff', '#88afe9'],
    Component: ColorMatchGame,
  },
  {
    id: 'bubbles',
    title: 'pop the bubbles',
    subtitle: 'endless bubble wrap',
    desc: 'pop forever. with haptics. yes really.',
    icon: 'ellipse-outline',
    duration: 'endless',
    mood: 'release',
    gradient: ['#f5cabc', '#eba18c'],
    Component: BubblesGame,
  },
  {
    id: 'grounding',
    title: '5-4-3-2-1',
    subtitle: 'grounding technique',
    desc: 'come back to your body. one sense at a time.',
    icon: 'flower-outline',
    duration: '2 min',
    mood: 'anxious',
    gradient: ['#d7d1ff', '#aca7df'],
    Component: GroundingGame,
  },
  {
    id: 'memory',
    title: 'memory match',
    subtitle: 'gentle focus game',
    desc: 'flip and pair. take your time.',
    icon: 'grid-outline',
    duration: '3 min',
    mood: 'distract',
    gradient: ['#f6e48c', '#efb8a7'],
    Component: MemoryGame,
  },
  {
    id: 'gratitude',
    title: 'gratitude spin',
    subtitle: 'quick mood lift',
    desc: 'spin the wheel. answer the prompt. easy.',
    icon: 'sunny-outline',
    duration: '30 sec',
    mood: 'lift',
    gradient: ['#efd96f', '#f4e2d8'],
    Component: GratitudeGame,
  },
];

const MOOD_FILTERS = [
  { key: null,        label: 'all' },
  { key: 'calm',      label: 'calm down' },
  { key: 'anxious',   label: 'anxious' },
  { key: 'release',   label: 'release' },
  { key: 'distract',  label: 'distract me' },
  { key: 'lift',      label: 'lift mood' },
];

export default function VibesScreen() {
  const [activeGame, setActiveGame]   = useState(null);
  const [moodFilter, setMoodFilter]   = useState(null);
  const { theme, accentColor }        = useTheme();

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const openGame = (game) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveGame(game);
  };

  // If a game is open, render it full-screen
  if (activeGame) {
    const G = activeGame.Component;
    return <G onClose={() => setActiveGame(null)} gradient={activeGame.gradient} />;
  }

  const filteredGames = moodFilter
    ? GAMES.filter(g => g.mood === moodFilter)
    : GAMES;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Text style={[styles.title, { color: theme.text }]}>vibes</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          quick mood resets. pick your vibe.
        </Text>

        {/* Mood filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {MOOD_FILTERS.map(f => {
            const active = moodFilter === f.key;
            return (
              <TouchableOpacity
                key={f.label}
                onPress={() => { tap(); setMoodFilter(f.key); }}
                style={[
                  styles.filterPill,
                  { borderColor: theme.border, backgroundColor: theme.card },
                  active && { backgroundColor: accentColor, borderColor: accentColor },
                ]}
              >
                <Text style={[styles.filterText, { color: active ? '#fff' : theme.subtext }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Game grid — 2 columns */}
        <View style={styles.grid}>
          {filteredGames.map(game => (
            <Pressable
              key={game.id}
              onPress={() => openGame(game)}
              style={({ pressed }) => [
                styles.cardWrap,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <LinearGradient
                colors={game.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardTop}>
                  <View style={styles.iconWrap}>
                    <Ionicons name={game.icon} size={22} color="#18151d" />
                  </View>
                  <Text style={styles.duration}>{game.duration}</Text>
                </View>
                <View style={styles.cardBottom}>
                  <Text style={styles.cardTitle}>{game.title}</Text>
                  <Text style={styles.cardDesc}>{game.desc}</Text>
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {/* Reminder card */}
        <View style={[styles.reminder, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={theme.subtext} />
          <Text style={[styles.reminderText, { color: theme.subtext }]}>
            these help in the moment. if things feel heavy for a while, talk to someone — the help tab has real lifelines.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  scroll:         { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },

  title:          { fontSize: 40, fontWeight: '900', lineHeight: 46 },
  subtitle:       { fontSize: 15, marginTop: 4, marginBottom: 20 },

  filterScroll:   { marginHorizontal: -20, marginBottom: 20 },
  filterRow:      { paddingHorizontal: 20, gap: 8 },
  filterPill:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5 },
  filterText:     { fontSize: 13, fontWeight: '600' },

  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  cardWrap:       { width: '47.5%', aspectRatio: 0.85, borderRadius: 28, overflow: 'hidden' },
  card:           { flex: 1, padding: 16, justifyContent: 'space-between' },
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconWrap: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.34)',
    alignItems: 'center', justifyContent: 'center',
  },
  duration:       { color: 'rgba(24,21,29,0.66)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardBottom:     { gap: 4 },
  cardTitle:      { color: '#18151d', fontSize: 18, fontWeight: '900' },
  cardDesc:       { color: 'rgba(24,21,29,0.7)', fontSize: 11, lineHeight: 16 },

  reminder:       { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, borderWidth: 0.5, alignItems: 'flex-start' },
  reminderText:   { flex: 1, fontSize: 12, lineHeight: 18, letterSpacing: -0.1 },
});
