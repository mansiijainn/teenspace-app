import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Pressable, Animated, Easing, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ChannelScreen from './ChannelScreen';
import { useState, useEffect, useRef } from 'react';
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
  { key: 'happy', label: 'happy', face: '☻', color: moodColors.happy },
  { key: 'calm', label: 'calm', face: '◡', color: moodColors.calm },
  { key: 'low', label: 'sad', face: '☁', color: moodColors.sad },
  { key: 'angry', label: 'mad', face: '!', color: moodColors.angry },
  { key: 'soft', label: 'soft', face: '♡', color: moodColors.soft },
];

const PROMPTS = [
  'what needs to leave your head today?',
  'what did you make it through yesterday?',
  'what feeling is taking up the most space?',
  'what would feel 2 percent lighter right now?',
];

const LIVE_LABELS = ['awake', 'listening', 'soft mode', 'no judgement', 'here'];

export default function HomeScreen({ onOpenChat, aiName = 'luna', onSpacesOpenChange, isEmailVerified = false }) {
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

  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];
  const liveLabel = LIVE_LABELS[new Date().getDate() % LIVE_LABELS.length];
  const hour = new Date().getHours();
  const isLateNight = hour >= 0 && hour < 5;
  const greeting = isLateNight ? 'rough night?' : 'hello, you';
  const reflection = isLateNight ? "i'm awake too." : 'how do you feel about your current emotions?';

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    trackAppOpen().then(setOpenNote);
    getMoodLogs(5).then(setRecentMoods);
  }, []);

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
    face: '♡',
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
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.kicker, { color: theme.subtext }]}>daily reflection</Text>
            <Text style={[styles.title, { color: theme.text }]}>{greeting}</Text>
          </View>
          <View style={[styles.liveBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Animated.View style={[styles.liveDot, { backgroundColor: accentColor, opacity: pulse }]} />
            <Text style={[styles.liveText, { color: theme.subtext }]}>{liveLabel}</Text>
          </View>
        </View>

        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.reflectionCard}>
          <View style={styles.cardLogo}>
            <View style={styles.diamond} />
            <View style={[styles.diamond, styles.diamondOffset]} />
          </View>
          <Text style={styles.reflectionTitle}>{reflection}</Text>
          <View style={styles.reflectionInput}>
            <Text style={styles.reflectionPlaceholder}>{prompt}</Text>
            <Ionicons name="sparkles" size={18} color="#18151d" />
          </View>
        </LinearGradient>

        {openNote && (
          <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.noteIcon, { backgroundColor: accentColor + '28' }]}>
              <Ionicons name="sparkles" size={18} color={accentColor} />
            </View>
            <View style={styles.noteCopy}>
              <Text style={[styles.noteTitle, { color: theme.text }]}>{openNote.title}</Text>
              <Text style={[styles.noteBody, { color: theme.subtext }]}>{openNote.body}</Text>
              {openNote.streakNote && (
                <Text style={[styles.noteTiny, { color: accentColor }]}>{openNote.streakNote}</Text>
              )}
            </View>
          </View>
        )}

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
                <Text style={styles.moodFace}>{mood.face}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </Pressable>
            ))}
          </View>
          {!!moodNote && <Text style={[styles.moodNote, { color: accentColor }]}>{moodNote}</Text>}
        </View>

        <Pressable onPress={handleAI} style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}>
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
                  <Text style={[styles.lunaTitle, { color: theme.card }]}>{localAiName}</Text>
                  <TouchableOpacity onPress={() => {
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
            <Ionicons name="arrow-forward" size={18} color={theme.card} />
          </View>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>spaces based on your needs</Text>
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
              <View style={styles.spaceArrow}>
                <Ionicons name="arrow-forward" size={15} color="#18151d" />
              </View>
            </Pressable>
          ))}
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
                        <Text style={styles.historyMoodFace}>{mood.face}</Text>
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
                <Text style={styles.emptyHistoryFace}>♡</Text>
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  kicker: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 22, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: '700' },
  reflectionCard: { borderRadius: 34, padding: 24, minHeight: 244, justifyContent: 'space-between', marginBottom: 16 },
  cardLogo: { width: 38, height: 38, position: 'relative' },
  diamond: { position: 'absolute', width: 16, height: 16, backgroundColor: '#18151d', transform: [{ rotate: '45deg' }], left: 3, top: 4 },
  diamondOffset: { left: 16, top: 17 },
  reflectionTitle: { color: '#18151d', fontSize: 32, lineHeight: 38, fontWeight: '800', maxWidth: 290 },
  reflectionInput: { minHeight: 58, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.45)', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reflectionPlaceholder: { color: 'rgba(24,21,29,0.62)', fontSize: 14, fontWeight: '700', flex: 1, marginRight: 10 },
  noteCard: { borderRadius: 26, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 12, marginBottom: 16 },
  noteIcon: { width: 42, height: 42, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  noteCopy: { flex: 1 },
  noteTitle: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  noteBody: { fontSize: 13, lineHeight: 19 },
  noteTiny: { fontSize: 12, fontWeight: '800', marginTop: 6 },
  moodPanel: { borderRadius: 30, borderWidth: 1, padding: 18, marginBottom: 16 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  panelTitle: { fontSize: 16, fontWeight: '800' },
  panelAction: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBubble: { width: 54, height: 70, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  moodFace: { fontSize: 20, color: '#18151d', fontWeight: '900', lineHeight: 22 },
  moodLabel: { color: '#18151d', fontSize: 9, fontWeight: '800', marginTop: 4 },
  moodNote: { fontSize: 12, fontWeight: '800', marginTop: 12 },
  lunaCard: { borderRadius: 30, minHeight: 94, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 26 },
  lunaIcon: { width: 54, height: 54, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  lunaText: { flex: 1 },
  aiNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  lunaTitle: { fontSize: 24, fontWeight: '900' },
  lunaSub: { fontSize: 13, fontWeight: '700', opacity: 0.76, marginTop: 3 },
  aiNameInput: { fontSize: 24, fontWeight: '900', borderBottomWidth: 1, paddingVertical: 0, minWidth: 80 },
  sectionTitle: { fontSize: 24, fontWeight: '900', lineHeight: 30, marginBottom: 14 },
  spaceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  spaceCard: { width: '48%', minHeight: 148, borderRadius: 28, padding: 16, justifyContent: 'space-between' },
  spaceName: { color: '#18151d', fontSize: 18, fontWeight: '900', marginTop: 14 },
  spaceDesc: { color: 'rgba(24,21,29,0.68)', fontSize: 12, fontWeight: '700', marginTop: 4 },
  spaceArrow: { position: 'absolute', right: 14, bottom: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
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
  historyMoodFace: { color: '#18151d', fontSize: 18, fontWeight: '900' },
  historyCopy: { flex: 1 },
  historyMoodLabel: { fontSize: 15, fontWeight: '900', marginBottom: 3 },
  historyMoodTime: { fontSize: 12, fontWeight: '700' },
  latestPill: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  latestText: { fontSize: 11, fontWeight: '900' },
  emptyHistory: { borderRadius: 24, padding: 22, alignItems: 'center' },
  emptyHistoryFace: { color: '#18151d', fontSize: 32, fontWeight: '900', marginBottom: 8 },
  emptyHistoryTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  emptyHistoryText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
