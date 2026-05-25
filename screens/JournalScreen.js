import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';
import JournalEntryScreen from './JournalEntryScreen';

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [activeEntry, setActiveEntry] = useState(null);
  const [isNew, setIsNew] = useState(false);
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
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        title: '',
        content: '',
        blocks: JSON.stringify([{ type: 'text', content: '', id: Date.now().toString() }]),
      })
      .select()
      .single();
    if (!error) {
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
      const textBlock = blocks.find(b => b.type === 'text' && b.content?.trim());
      const firstLine = textBlock?.content?.split('\n')[0];
      return firstLine?.slice(0, 40) || 'untitled';
    } catch {
      return 'untitled';
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
        <Text style={[styles.title, { color: theme.text }]}>journal</Text>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: accentColor }]}
          onPress={createNewEntry}
        >
          <Text style={styles.newBtnText}>+ new</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {entries.length === 0 && (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>nothing yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
              your thoughts live here.{'\n'}no one else can see this.
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
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  newBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyTitle: { fontSize: 22, fontWeight: '700' },
  emptySubtext: { fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.6 },
  emptyBtn: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  cardDate: { fontSize: 12 },
  cardPreview: { fontSize: 14, lineHeight: 20, opacity: 0.7 },
});