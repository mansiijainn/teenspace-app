import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ChannelScreen from './ChannelScreen';
import { useState, useEffect } from 'react';
import { useTheme, moodColors } from '../context/ThemeContext';
import { getMoodLogs, recordMoodEntry, trackAppOpen } from '../utils/safetySignals';

const channels = [
  { id: 1, name: 'rants', icon: 'flame', desc: 'let it out', color: '#e58d75' },
  { id: 2, name: 'wins', icon: 'trophy', desc: 'tiny flexes', color: '#efd96f' },
  { id: 3, name: 'school', icon: 'school', desc: 'finals, drama', color: '#88afe9' },
  { id: 4, name: 'home life', icon: 'home', desc: 'safe space', color: '#ead9d2' },
  { id: 5, name: 'mental health', icon: 'pulse', desc: 'real talk', color: '#aca7df' },
  { id: 6, name: 'random', icon: 'sparkles', desc: 'anything', color: '#9ebd8f' },
];

const MOODS = [
  { key: 'happy', label: 'happy', icon: 'sunny', color: moodColors.happy },
  { key: 'calm', label: 'calm', icon: 'leaf', color: moodColors.calm },
  { key: 'low', label: 'sad', icon: 'rainy', color: moodColors.sad },
  { key: 'angry', label: 'mad', icon: 'flash', color: moodColors.angry },
  { key: 'soft', label: 'soft', icon: 'heart', color: moodColors.soft },
];

const DAILY_GREETINGS = ['hello, you', 'hey, you', 'soft check-in', 'hi, spillr'];

export default function HomeScreen({ onOpenChat, aiName = 'luna', onAiNameChange, onSpacesOpenChange, isEmailVerified = false }) {
  const [activeChannel, setActiveChannel] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(aiName);
  const [localAiName, setLocalAiName] = useState(aiName);
  const [openNote, setOpenNote] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodNote, setMoodNote] = useState('');
  const [recentMoods, setRecentMoods] = useState([]);
  const [moodHistoryOpen, setMoodHistoryOpen] = useState(false);
  const { theme, accentColor, gradient } = useTheme();

  const hour = new Date().getHours();
  const dayIndex = new Date().getDate();
  const topGreeting = hour >= 0 && hour < 5
    ? 'rough night?'
    : DAILY_GREETINGS[dayIndex % DAILY_GREETINGS.length];
  const visibleOpenNote = openNote?.kind === 'streak' ? null : openNote;
  const topNote = visibleOpenNote || {
    kind: 'daily',
    title: 'you made it through yesterday',
    body: "that's enough.",
    streakNote: null,
  };
  const topNoteTitle = topNote.kind === 'late-night' ? "i'm awake too" : topNote.title;
  const topNoteBody = topNote.kind === 'late-night' ? 'no pressure to explain.' : topNote.body;

  useEffect(() => {
    trackAppOpen().then(setOpenNote);
    getMoodLogs(5).then(setRecentMoods);
  }, []);

  useEffect(() => {
    setLocalAiName(aiName);
    setTempName(aiName);
  }, [aiName]);

  useEffect(() => {
    onSpacesOpenChange?.(Boolean(activeChannel));

    return () => {
      onSpacesOpenChange?.(false);
    };
  }, [activeChannel, onSpacesOpenChange]);

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const handleChannel = (channel) => {
    tap();
    setActiveChannel(channel);
  };
  const handleAI = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onOpenChat();
  };
  const saveName = () => {
    const nextName = tempName.trim() || 'luna';
    setLocalAiName(nextName);
    setTempName(nextName);
    onAiNameChange?.(nextName);
    setEditingName(false);
  };
  const handleMood = async (mood) => {
    setSelectedMood(mood.key);
    setMoodNote(`${mood.label} logged for today`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await recordMoodEntry(mood.key);
    const logs = await getMoodLogs(5);
    setRecentMoods(logs);
  };
  const openMoodHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMoodHistoryOpen(true);
  };
  const formatMoodTime = (createdAt) => new Date(createdAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const getMoodMeta = (moodKey) => MOODS.find((option) => option.key === moodKey) || {
    key: moodKey,
    label: moodKey,
    icon: 'heart',
    color: accentColor,
  };

  if (activeChannel) {
    return (
      <ChannelScreen
        channel={activeChannel}
        onBack={() => setActiveChannel(null)}
        isEmailVerified={isEmailVerified}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingBlock}>
          <Text style={[styles.title, { color: theme.text }]}>{topGreeting}</Text>
        </View>

        <View style={[
          styles.noteCard,
          topNote.kind === 'late-night' && styles.noteCardCompact,
          { backgroundColor: topNote.kind === 'late-night' ? accentColor + '18' : theme.card, borderColor: topNote.kind === 'late-night' ? accentColor + '40' : theme.border },
        ]}>
          <View style={[styles.noteIcon, topNote.kind === 'late-night' && styles.noteIconCompact, { backgroundColor: accentColor + '28' }]}>
            <Ionicons name={topNote.kind === 'late-night' ? 'moon' : 'sparkles'} size={topNote.kind === 'late-night' ? 15 : 18} color={accentColor} />
          </View>
          <View style={styles.noteCopy}>
            <Text style={[styles.noteTitle, topNote.kind === 'late-night' && styles.noteTitleCompact, { color: theme.text }]}>{topNoteTitle}</Text>
            <Text style={[styles.noteBody, topNote.kind === 'late-night' && styles.noteBodyCompact, { color: theme.subtext }]}>{topNoteBody}</Text>
            {topNote.streakNote && topNote.kind !== 'late-night' && (
              <Text style={[styles.noteTiny, { color: accentColor }]}>{topNote.streakNote}</Text>
            )}
          </View>
        </View>

        <Pressable onPress={editingName ? undefined : handleAI} style={({ pressed }) => [pressed && !editingName && { transform: [{ scale: 0.98 }] }]}>
          <View style={[styles.lunaCard, { backgroundColor: theme.text }]}>
            <View style={[styles.lunaIcon, { backgroundColor: theme.card }]}>
              <Ionicons name="moon" size={24} color={accentColor} />
            </View>
            <View style={styles.lunaText}>
              {editingName ? (
                <TextInput
                  style={[styles.aiNameInput, { color: theme.card, borderBottomColor: theme.card }]}
                  value={tempName}
                  onChangeText={setTempName}
                  autoFocus
                  onBlur={saveName}
                  onSubmitEditing={saveName}
                  maxLength={20}
                />
              ) : (
                <View style={styles.aiNameRow}>
                  <Text style={[styles.lunaTitle, { color: theme.card }]}>{localAiName}</Text>
                  <TouchableOpacity onPress={(event) => {
                    event?.stopPropagation?.();
                    tap();
                    setTempName(localAiName);
                    setEditingName(true);
                  }}>
                    <Ionicons name="pencil" size={12} color={theme.card} />
                  </TouchableOpacity>
                </View>
              )}
              <Text style={[styles.lunaSub, { color: theme.card }]}>tap to spill without advice</Text>
            </View>
          </View>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>chatspaces</Text>
        <View style={styles.spaceGrid}>
          {channels.map((channel, index) => (
            <Pressable
              key={channel.id}
              onPress={() => handleChannel(channel)}
              style={({ pressed }) => [
                styles.spaceCard,
                {
                  backgroundColor: channel.color,
                  transform: [{ translateY: index % 2 ? 12 : 0 }],
                },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons name={channel.icon} size={22} color="#18151d" />
              <Text style={styles.spaceName}>{channel.name}</Text>
              <Text style={styles.spaceDesc}>{channel.desc}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.moodPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.panelHeader}>
            <Text style={[styles.panelTitle, { color: theme.text }]}>daily mood log</Text>
            <TouchableOpacity onPress={openMoodHistory} style={styles.panelAction}>
              <Ionicons name="ellipsis-horizontal" size={18} color={theme.subtext} />
            </TouchableOpacity>
          </View>
          <View style={styles.moodRow}>
            {MOODS.map((mood, index) => (
              <Pressable
                key={mood.key}
                onPress={() => handleMood(mood)}
                style={[
                  styles.moodBubble,
                  {
                    backgroundColor: mood.color,
                    marginTop: index % 2 ? 10 : 0,
                    borderColor: selectedMood === mood.key ? '#18151d' : 'rgba(255,255,255,0.7)',
                  },
                ]}
              >
                <Ionicons name={mood.icon} size={20} color="#18151d" />
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </Pressable>
            ))}
          </View>
          {!!moodNote && <Text style={[styles.moodNote, { color: accentColor }]}>{moodNote}</Text>}
        </View>
      </ScrollView>

      <Modal
        visible={moodHistoryOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMoodHistoryOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMoodHistoryOpen(false)}>
          <Pressable
            style={[styles.moodSheet, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
            onPress={() => {}}
          >
            <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sheetHero}>
              <View>
                <Text style={styles.sheetKicker}>mood log</Text>
                <Text style={styles.sheetTitle}>tiny check-ins</Text>
              </View>
              <TouchableOpacity style={styles.sheetClose} onPress={() => setMoodHistoryOpen(false)}>
                <Ionicons name="close" size={18} color="#18151d" />
              </TouchableOpacity>
            </LinearGradient>

            {recentMoods.length ? (
              <View style={styles.moodHistoryList}>
                {recentMoods.map((item, index) => {
                  const mood = getMoodMeta(item.mood);
                  return (
                    <View key={`${item.createdAt}-${index}`} style={[styles.moodHistoryRow, { backgroundColor: theme.input }]}>
                      <View style={[styles.historyMoodBubble, { backgroundColor: mood.color }]}>
                        <Ionicons name={mood.icon} size={18} color="#18151d" />
                      </View>
                      <View style={styles.historyCopy}>
                        <Text style={[styles.historyMoodLabel, { color: theme.text }]}>{mood.label}</Text>
                        <Text style={[styles.historyMoodTime, { color: theme.subtext }]}>{formatMoodTime(item.createdAt)}</Text>
                      </View>
                      {index === 0 && (
                        <View style={[styles.latestPill, { backgroundColor: accentColor + '24' }]}>
                          <Text style={[styles.latestText, { color: accentColor }]}>latest</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.emptyHistory, { backgroundColor: theme.input }]}>
                <Ionicons name="heart-outline" size={30} color={accentColor} />
                <Text style={[styles.emptyHistoryTitle, { color: theme.text }]}>no moods yet</Text>
                <Text style={[styles.emptyHistoryText, { color: theme.subtext }]}>tap any bubble to save your first soft check-in.</Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 118 },
  greetingBlock: { marginBottom: 14 },
  title: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  noteCard: { borderRadius: 26, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 12, marginBottom: 16 },
  noteCardCompact: { borderRadius: 22, padding: 11, marginTop: -4 },
  noteIcon: { width: 42, height: 42, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  noteIconCompact: { width: 34, height: 34, borderRadius: 15 },
  noteCopy: { flex: 1 },
  noteTitle: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  noteTitleCompact: { fontSize: 13, marginBottom: 1 },
  noteBody: { fontSize: 13, lineHeight: 19 },
  noteBodyCompact: { fontSize: 12, lineHeight: 16 },
  noteTiny: { fontSize: 12, fontWeight: '800', marginTop: 6 },
  moodPanel: { borderRadius: 30, borderWidth: 1, padding: 18, marginBottom: 16 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  panelTitle: { fontSize: 16, fontWeight: '800' },
  panelAction: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBubble: { width: 54, height: 70, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  moodLabel: { color: '#18151d', fontSize: 9, fontWeight: '800', marginTop: 4 },
  moodNote: { fontSize: 12, fontWeight: '800', marginTop: 12 },
  lunaCard: { borderRadius: 30, minHeight: 94, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  lunaIcon: { width: 54, height: 54, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  lunaText: { flex: 1 },
  aiNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  lunaTitle: { fontSize: 24, fontWeight: '900' },
  lunaSub: { fontSize: 13, fontWeight: '700', opacity: 0.76, marginTop: 3 },
  aiNameInput: { fontSize: 24, fontWeight: '900', borderBottomWidth: 1, paddingVertical: 0, minWidth: 80 },
  sectionTitle: { fontSize: 24, fontWeight: '900', lineHeight: 30, marginBottom: 14 },
  spaceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  spaceCard: { width: '48%', minHeight: 148, borderRadius: 28, padding: 16, justifyContent: 'space-between' },
  spaceName: { color: '#18151d', fontSize: 18, fontWeight: '900', marginTop: 14 },
  spaceDesc: { color: 'rgba(24,21,29,0.68)', fontSize: 12, fontWeight: '700', marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(24,21,29,0.35)', justifyContent: 'flex-end', padding: 16 },
  moodSheet: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 14,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  sheetHero: { minHeight: 116, borderRadius: 26, padding: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  sheetKicker: { color: 'rgba(24,21,29,0.56)', fontSize: 13, fontWeight: '800', marginBottom: 6 },
  sheetTitle: { color: '#18151d', fontSize: 28, lineHeight: 32, fontWeight: '900' },
  sheetClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.42)', alignItems: 'center', justifyContent: 'center' },
  moodHistoryList: { gap: 10 },
  moodHistoryRow: { minHeight: 68, borderRadius: 24, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyMoodBubble: { width: 46, height: 52, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  historyCopy: { flex: 1 },
  historyMoodLabel: { fontSize: 15, fontWeight: '900', marginBottom: 3 },
  historyMoodTime: { fontSize: 12, fontWeight: '700' },
  latestPill: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  latestText: { fontSize: 11, fontWeight: '900' },
  emptyHistory: { borderRadius: 24, padding: 22, alignItems: 'center' },
  emptyHistoryTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  emptyHistoryText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
