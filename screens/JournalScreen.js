import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useTheme, moodColors } from '../context/ThemeContext';
import JournalEntryScreen from './JournalEntryScreen';
import { recordMoodEntry } from '../utils/safetySignals';

const MOODS = [
  { key: 'soft', label: 'soft', icon: '♡', color: moodColors.soft },
  { key: 'okay', label: 'okay', icon: '☻', color: moodColors.happy },
  { key: 'low', label: 'low', icon: '☁', color: moodColors.sad },
  { key: 'anxious', label: 'anxious', icon: '~', color: moodColors.anxious },
  { key: 'angry', label: 'angry', icon: '!', color: moodColors.angry },
  { key: 'numb', label: 'numb', icon: '·', color: moodColors.calm },
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
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, { color: theme.subtext }]}>private reflection</Text>
          <Text style={[styles.title, { color: theme.text }]}>dear diary-ish</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>fonts, colors, doodles and photos live inside each entry.</Text>
        </View>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: theme.text }]}
          onPress={createNewEntry}
        >
          <Ionicons name="add" size={22} color={theme.card} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.heroCard, { backgroundColor: theme.panel }]}>
          <View style={styles.heroText}>
            <Text style={styles.heroEyebrow}>today's page</Text>
            <Text style={styles.heroTitle}>what's the vibe before you write?</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
            {MOODS.map((mood) => {
              const active = selectedMood === mood.key;
              return (
                <TouchableOpacity
                  key={mood.key}
                  style={[
                    styles.moodBubble,
                    {
                      backgroundColor: mood.color,
                      borderColor: active ? theme.text : 'rgba(255,255,255,0.42)',
                      transform: [{ scale: active ? 1.05 : 1 }],
                    },
                  ]}
                  onPress={() => setSelectedMood(mood.key)}
                >
                  <Text style={styles.moodIcon}>{mood.icon}</Text>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={[styles.heroAction, { backgroundColor: theme.card }]} onPress={createNewEntry}>
            <Text style={[styles.heroActionText, { color: theme.text }]}>start a soft page</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.text} />
          </TouchableOpacity>
        </View>

        {entries.length === 0 && (
          <View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.emptyEmoji}>✎</Text>
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

        {entries.length > 0 && (
          <Text style={[styles.sectionTitle, { color: theme.text }]}>recent pages</Text>
        )}

        {entries.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
            onPress={() => setActiveEntry(entry)}
            onLongPress={() => deleteEntry(entry)}
          >
            <View style={styles.cardTop}>
              <View style={[styles.entryMood, { backgroundColor: getEntryMood(entry)?.color || accentColor }]}>
                <Text style={styles.entryMoodText}>{getEntryMood(entry)?.icon || '♡'}</Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                  {getEntryTitle(entry)}
                </Text>
                <Text style={[styles.cardPreview, { color: theme.subtext }]} numberOfLines={2}>
                  {getEntryPreview(entry)}
                </Text>
              </View>
              <Text style={[styles.cardDate, { color: theme.subtext }]}>
                {formatDate(entry.updated_at || entry.created_at)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 20,
    marginBottom: 18,
  },
  headerCopy: { flex: 1, paddingRight: 18 },
  kicker: { fontSize: 13, fontWeight: '700', marginBottom: 5 },
  title: { fontSize: 34, fontWeight: '900', lineHeight: 39 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  newBtn: { width: 52, height: 52, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 118 },
  heroCard: { borderRadius: 34, padding: 20, marginBottom: 18 },
  heroText: { marginBottom: 18 },
  heroEyebrow: { color: 'rgba(24,21,29,0.55)', fontSize: 13, fontWeight: '700', marginBottom: 7 },
  heroTitle: { color: '#18151d', fontSize: 28, lineHeight: 34, fontWeight: '900', maxWidth: 300 },
  moodRow: { gap: 10, paddingRight: 10, paddingBottom: 4 },
  moodBubble: { width: 74, height: 84, borderRadius: 34, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  moodIcon: { color: '#18151d', fontSize: 22, fontWeight: '900' },
  moodLabel: { color: '#18151d', fontSize: 11, fontWeight: '800', marginTop: 5 },
  heroAction: { height: 54, borderRadius: 22, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  heroActionText: { fontSize: 14, fontWeight: '900' },
  empty: { alignItems: 'center', marginTop: 20, gap: 12, borderRadius: 30, borderWidth: 1, padding: 28 },
  emptyEmoji: { fontSize: 42 },
  emptyTitle: { fontSize: 22, fontWeight: '900' },
  emptySubtext: { fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.6 },
  emptyBtn: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '900', marginBottom: 12, marginTop: 6 },
  card: {
    borderRadius: 26,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  entryMood: { width: 52, height: 62, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  entryMoodText: { color: '#18151d', fontSize: 22, fontWeight: '900' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardCopy: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  cardDate: { fontSize: 12 },
  cardPreview: { fontSize: 14, lineHeight: 20, opacity: 0.7 },
});
