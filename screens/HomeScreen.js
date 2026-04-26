import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChannelScreen from './ChannelScreen';
import { useState } from 'react';

const channels = [
  { id: 1, name: 'Rants', emoji: '😤', description: 'let it all out, no judgment', type: 'channel' },
  { id: 2, name: 'Achievements', emoji: '🏆', description: 'flex your wins, big or small', type: 'channel' },
  { id: 3, name: 'School', emoji: '📚', description: 'homework, exams, all that fun stuff', type: 'channel' },
  { id: 4, name: 'Home Life', emoji: '🏠', description: 'family stuff, safe space', type: 'channel' },
  { id: 5, name: 'Mental Health', emoji: '🧠', description: 'talk it out, we listen', type: 'channel' },
  { id: 6, name: 'Random', emoji: '🎲', description: 'anything and everything', type: 'channel' },
];

export default function HomeScreen({ onOpenChat }) {
  const [activeChannel, setActiveChannel] = useState(null);
  const [aiName, setAiName] = useState('luna');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('luna');

  if (activeChannel) {
    return <ChannelScreen channel={activeChannel} onBack={() => setActiveChannel(null)} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>hey 👋</Text>
          <Text style={styles.subtitle}>what's on your mind today?</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>live</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* AI Card */}
        <TouchableOpacity style={styles.aiCard} onPress={onOpenChat}>
          <View style={styles.aiCardLeft}>
            <Text style={styles.aiEmoji}>🌙</Text>
            <View>
              {editingName ? (
                <TextInput
                  style={styles.aiNameInput}
                  value={tempName}
                  onChangeText={setTempName}
                  autoFocus
                  onBlur={() => {
                    setAiName(tempName || 'luna');
                    setEditingName(false);
                  }}
                  onSubmitEditing={() => {
                    setAiName(tempName || 'luna');
                    setEditingName(false);
                  }}
                  maxLength={20}
                />
              ) : (
                <View style={styles.aiNameRow}>
                  <Text style={styles.aiName}>{aiName}</Text>
                  <TouchableOpacity onPress={() => { setTempName(aiName); setEditingName(true); }}>
                    <Text style={styles.editName}>✏️</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.aiDesc}>your personal ai, here to listen</Text>
            </View>
          </View>
          <View style={styles.aiTag}>
            <Text style={styles.aiTagText}>talk →</Text>
          </View>
        </TouchableOpacity>

        {/* Channels */}
        <Text style={styles.sectionTitle}>spaces</Text>
        {channels.map((channel) => (
          <TouchableOpacity
            key={channel.id}
            style={styles.channelCard}
            onPress={() => setActiveChannel(channel)}
          >
            <Text style={styles.channelEmoji}>{channel.emoji}</Text>
            <View style={styles.channelInfo}>
              <Text style={styles.channelName}>{channel.name}</Text>
              <Text style={styles.channelDesc}>{channel.description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  aiCard: {
    background: 'transparent',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#7c3aed',
    backgroundColor: '#120820',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  aiCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  aiEmoji: {
    fontSize: 40,
  },
  aiNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  aiNameInput: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: '#7c3aed',
    minWidth: 80,
    paddingVertical: 2,
  },
  editName: {
    fontSize: 14,
  },
  aiDesc: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  aiTag: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  aiTagText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
    marginBottom: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  channelCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  channelEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 3,
  },
  channelDesc: {
    fontSize: 12,
    color: '#555',
  },
  arrow: {
    fontSize: 22,
    color: '#333',
  },
});