import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';
import { Platform } from 'react-native';

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO  = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// 5 mood colors with values for tracking (1 = lowest, 5 = highest)
const MOODS = [
  { color: '#3d4a5c', value: 1, label: 'rough',  caption: 'heavy day' },     // deep storm blue
  { color: '#7a6a8a', value: 2, label: 'low',    caption: 'feeling off' },   // muted purple-grey
  { color: '#b0a890', value: 3, label: 'okay',   caption: 'just exist' },    // warm beige
  { color: '#e8a87c', value: 4, label: 'good',   caption: 'soft day' },      // warm coral
  { color: '#f5d547', value: 5, label: 'great',  caption: 'glowing' },       // bright sunshine
];

export default function MoodCheckIn() {
  const [todayMood, setTodayMood] = useState(null);
  const [loading, setLoading]     = useState(true);
  const { theme, accentColor }    = useTheme();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadToday();
  }, []);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [todayMood]);

  const loadToday = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();
      if (data) setTodayMood(data);
    } catch {
      // no entry yet → that's fine
    }
    setLoading(false);
  };

  const logMood = async (mood) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('moods')
        .upsert({
          user_id:    user.id,
          color:      mood.color,
          mood_value: mood.value,
          date:       today,
        }, { onConflict: 'user_id,date' })
        .select()
        .single();
      if (!error && data) {
        fade.setValue(0);
        setTodayMood(data);
      }
    } catch (e) {
      console.log('Mood save error:', e);
    }
  };

  if (loading) return null;

  // Already logged today → show their color
  if (todayMood) {
    const moodInfo = MOODS.find(m => m.value === todayMood.mood_value);
    return (
      <Animated.View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, opacity: fade }]}>
        <View style={styles.row}>
          <View style={[styles.swatch, { backgroundColor: todayMood.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.subtext }]}>today's mood</Text>
            <Text style={[styles.moodName, { color: theme.text }]}>{moodInfo?.label || 'logged'}</Text>
          </View>
          <Pressable onPress={() => setTodayMood(null)} style={styles.editBtn}>
            <Ionicons name="pencil" size={14} color={theme.subtext} />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // Not logged yet → show 5 color taps
  return (
    <Animated.View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, opacity: fade }]}>
      <Text style={[styles.label, { color: theme.subtext }]}>how you feel right now</Text>
      <Text style={[styles.prompt, { color: theme.text }]}>tap your mood</Text>
      <View style={styles.colors}>
        {MOODS.map(m => (
          <Pressable
            key={m.value}
            onPress={() => logMood(m)}
            style={({ pressed }) => [
              styles.colorCol,
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
          >
            <View style={[styles.colorBtn, { backgroundColor: m.color }]} />
            <Text style={[styles.colorLabel, { color: theme.text }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card:       { padding: 16, borderRadius: 20, borderWidth: 0.5, marginBottom: 16 },
  label:      { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', fontFamily: MONO },
prompt:     { fontSize: 22, fontWeight: '400', marginTop: 4, letterSpacing: -0.3, fontStyle: 'italic', fontFamily: SERIF },
moodName:   { fontSize: 22, fontWeight: '400', marginTop: 2, letterSpacing: -0.3, fontStyle: 'italic', fontFamily: SERIF },
  colors:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, gap: 8 },
colorCol:    { flex: 1, alignItems: 'center', gap: 6 },
colorBtn:    { width: '100%', aspectRatio: 1, borderRadius: 14 },
colorLabel:  { fontSize: 11, letterSpacing: 0.3, fontStyle: 'italic', fontFamily: SERIF },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch:     { width: 36, height: 36, borderRadius: 12 },
  editBtn:    { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});                                             