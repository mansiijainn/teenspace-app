import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';
import JournalEntryScreen from './JournalEntryScreen';
import { recordMoodEntry } from '../utils/safetySignals';

const MOODS = [
  { key: 'soft', label: 'soft', icon: '♡' },
  { key: 'okay', label: 'okay', icon: '✦' },
  { key: 'low', label: 'low', icon: '☁' },
  { key: 'anxious', label: 'anxious', icon: '~' },
  { key: 'angry', label: 'angry', icon: '!' },
  { key: 'numb', label: 'numb', icon: '·' },
];

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [activeEntry, setActiveEntry] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [selectedMood, setSelectedMood] = useState('soft');
  const { theme, accentColor } = useTheme();

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (!error) setEntries(data || []);
  };

  const createNewEntry = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const entryState = {
      mood: selectedMood,
      segments: [{ id: Date.now().toString(), text: '', fmt: { fontSize: 18 } }],
      paths: [],
      photos: [],
    };
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        title: '',
        content: '',
        blocks: JSON.stringify(entryState),
      })
      .select()
      .single();
    if (!error) {
      await recordMoodEntry(selectedMood);
      setActiveEntry(data);
      setIsNew(true);
    }
  };

  const deleteEntry = (entry) => {
    Alert.alert('delete', 'delete this entry?', [
      { text: 'cancel', style: 'cancel' },
      {
        text: 'delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('journal_entries').delete().eq('id', entry.id);
          fetchEntries();
        }
      }
    ]);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getEntryPreview = (entry) => {
    if (!entry.blocks) return entry.content || 'empty entry';
    try {
      const blocks = JSON.parse(entry.blocks);
      if (blocks?.segments) {
        const textBlock = blocks.segments.find(b => b.text?.trim());
        return textBlock?.text?.slice(0, 100) || 'empty entry';
      }
      const textBlock = blocks.find(b => b.type === 'text' && b.content?.trim());
      return textBlock?.content?.slice(0, 100) || 'empty entry';
    } catch {
      return entry.content || 'empty entry';
    }
  };

  const getEntryTitle = (entry) => {
    if (entry.title?.trim()) return entry.title;
    try {
      const blocks = JSON.parse(entry.blocks);
      if (blocks?.segments) {
        const textBlock = blocks.segments.find(b => b.text?.trim());
        const firstLine = textBlock?.text?.split('\n')[0];
        return firstLine?.slice(0, 40) || 'untitled';
      }
      const textBlock = blocks.find(b => b.type === 'text' && b.content?.trim());
      const firstLine = textBlock?.content?.split('\n')[0];
      return firstLine?.slice(0, 40) || 'untitled';
    } catch {
      return 'untitled';
    }
  };

  const getEntryMood = (entry) => {
    try {
      const blocks = JSON.parse(entry.blocks);
      return MOODS.find(mood => mood.key === blocks?.mood);
    } catch {
      return null;
    }
  };

  if (activeEntry) {
    return (
      <JournalEntryScreen
        entry={activeEntry}
        onClose={() => {
          setActiveEntry(null);
          setIsNew(false);
          fetchEntries();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, { color: accentColor }]}>dear diary-ish</Text>
          <Text style={[styles.title, { color: theme.text }]}>journal</Text>
        </View>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: accentColor }]}
          onPress={createNewEntry}
        >
          <Text style={styles.newBtnText}>+ new</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.moodCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.moodTitle, { color: theme.text }]}>what's the vibe before you write?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
            {MOODS.map((mood) => {
              const active = selectedMood === mood.key;
              return (
                <TouchableOpacity
                  key={mood.key}
                  style={[
                    styles.moodPill,
                    {
                      backgroundColor: active ? accentColor : theme.input,
                      borderColor: active ? accentColor : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedMood(mood.key)}
                >
                  <Text style={[styles.moodIcon, { color: active ? '#fff' : accentColor }]}>{mood.icon}</Text>
                  <Text style={[styles.moodLabel, { color: active ? '#fff' : theme.subtext }]}>{mood.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={[styles.moodHint, { color: theme.subtext }]}>
            fonts, colors, doodles and photos are inside each entry.
          </Text>
        </View>

        {entries.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✧</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>blank page energy</Text>
            <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
              write messy. make it pink. doodle over it.{'\n'}this one's just yours.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: accentColor }]}
              onPress={createNewEntry}
            >
              <Text style={styles.emptyBtnText}>start writing</Text>
            </TouchableOpacity>
          </View>
        )}

        {entries.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setActiveEntry(entry)}
            onLongPress={() => deleteEntry(entry)}
          >
            {getEntryMood(entry) && (
              <View style={[styles.entryMood, { backgroundColor: accentColor + '18' }]}>
                <Text style={[styles.entryMoodText, { color: accentColor }]}>
                  {getEntryMood(entry).icon} {getEntryMood(entry).label}
                </Text>
              </View>
            )}
            <View style={styles.cardTop}>
              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                {getEntryTitle(entry)}
              </Text>
              <Text style={[styles.cardDate, { color: theme.subtext }]}>
                {formatDate(entry.updated_at || entry.created_at)}
              </Text>
            </View>
            <Text style={[styles.cardPreview, { color: theme.subtext }]} numberOfLines={2}>
              {getEntryPreview(entry)}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 24,
  },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 3 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  newBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  moodCard: { borderRadius: 24, borderWidth: 1, padding: 16, marginBottom: 18 },
  moodTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12 },
  moodRow: { gap: 8, paddingRight: 10 },
  moodPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  moodIcon: { fontSize: 15, fontWeight: '900' },
  moodLabel: { fontSize: 13, fontWeight: '700' },
  moodHint: { fontSize: 12, lineHeight: 18, marginTop: 12 },
  empty: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 22, fontWeight: '700' },
  emptySubtext: { fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.6 },
  emptyBtn: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
  entryMood: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, marginBottom: 10 },
  entryMoodText: { fontSize: 11, fontWeight: '800' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  cardDate: { fontSize: 12 },
  cardPreview: { fontSize: 14, lineHeight: 20, opacity: 0.7 },
});
