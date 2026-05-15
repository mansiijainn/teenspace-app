import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChannelScreen from './ChannelScreen';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const channels = [
  { id: 1, name: 'Rants', emoji: '😤', description: 'let it all out, no judgment' },
  { id: 2, name: 'Achievements', emoji: '🏆', description: 'flex your wins, big or small' },
  { id: 3, name: 'School', emoji: '📚', description: 'homework, exams, all that fun stuff' },
  { id: 4, name: 'Home Life', emoji: '🏠', description: 'family stuff, safe space' },
  { id: 5, name: 'Mental Health', emoji: '🧠', description: 'talk it out, we listen' },
  { id: 6, name: 'Random', emoji: '🎲', description: 'anything and everything' },
];

export default function HomeScreen({ onOpenChat, aiName = 'luna' }) {
  const [activeChannel, setActiveChannel] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(aiName);
  const [localAiName, setLocalAiName] = useState(aiName);
  const { theme, accentColor } = useTheme();

  if (activeChannel) {
    return <ChannelScreen channel={activeChannel} onBack={() => setActiveChannel(null)} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.text }]}>hey 👋</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>what's on your mind today?</Text>
        </View>
        <View style={[styles.onlineBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>live</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* AI Card */}
        <TouchableOpacity
          style={[styles.aiCard, { backgroundColor: accentColor + '15', borderColor: accentColor }]}
          onPress={onOpenChat}
        >
          <View style={styles.aiCardLeft}>
            <Text style={styles.aiEmoji}>🌙</Text>
            <View>
              {editingName ? (
                <TextInput
                  style={[styles.aiNameInput, { borderBottomColor: accentColor, color: theme.text }]}
                  value={tempName}
                  onChangeText={setTempName}
                  autoFocus
                  onBlur={() => {
                    setLocalAiName(tempName || 'luna');
                    setEditingName(false);
                  }}
                  onSubmitEditing={() => {
                    setLocalAiName(tempName || 'luna');
                    setEditingName(false);
                  }}
                  maxLength={20}
                />
              ) : (
                <View style={styles.aiNameRow}>
                  <Text style={[styles.aiName, { color: theme.text }]}>{localAiName}</Text>
                  <TouchableOpacity onPress={() => { setTempName(localAiName); setEditingName(true); }}>
                    <Text style={styles.editName}>✏️</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={[styles.aiDesc, { color: theme.subtext }]}>your personal ai, here to listen</Text>
            </View>
          </View>
          <View style={[styles.aiTag, { backgroundColor: accentColor }]}>
            <Text style={styles.aiTagText}>talk →</Text>
          </View>
        </TouchableOpacity>

        {/* Channels */}
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>spaces</Text>
        {channels.map((channel) => (
          <TouchableOpacity
            key={channel.id}
            style={[styles.channelCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setActiveChannel(channel)}
          >
            <Text style={styles.channelEmoji}>{channel.emoji}</Text>
            <View style={styles.channelInfo}>
              <Text style={[styles.channelName, { color: theme.text }]}>{channel.name}</Text>
              <Text style={[styles.channelDesc, { color: theme.subtext }]}>{channel.description}</Text>
            </View>
            <Text style={[styles.arrow, { color: theme.border }]}>›</Text>
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
  greeting: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 4 },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  onlineText: { color: '#22c55e', fontSize: 12, fontWeight: '600' },
  aiCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  aiCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  aiEmoji: { fontSize: 40 },
  aiNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiName: { fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
  aiNameInput: {
    fontSize: 20,
    fontWeight: '700',
    borderBottomWidth: 1,
    minWidth: 80,
    paddingVertical: 2,
  },
  editName: { fontSize: 14 },
  aiDesc: { fontSize: 12, marginTop: 4 },
  aiTag: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  aiTagText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  channelCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },
  channelEmoji: { fontSize: 28, marginRight: 14 },
  channelInfo: { flex: 1 },
  channelName: { fontSize: 16, fontWeight: '600', marginBottom: 3 },
  channelDesc: { fontSize: 12 },
  arrow: { fontSize: 22 },
});