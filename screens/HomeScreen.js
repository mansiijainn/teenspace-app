import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ChannelScreen from './ChannelScreen';
import { useState, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const channels = [
  { id: 1, name: 'rants',         icon: 'flame',    desc: 'let it out, no judgment' },
  { id: 2, name: 'wins',          icon: 'trophy',   desc: 'flex anything, big or small' },
  { id: 3, name: 'school',        icon: 'school',   desc: 'finals, drama, all of it' },
  { id: 4, name: 'home life',     icon: 'home',     desc: 'family stuff, safe space' },
  { id: 5, name: 'mental health', icon: 'pulse',    desc: 'real talk, we got you' },
  { id: 6, name: 'random',        icon: 'sparkles', desc: 'anything and everything' },
];

// Vibe of the day rotates — feels alive
const VIBES = [
  'soft launch szn',
  'main character energy',
  'unhinged but make it cute',
  'romanticizing the mundane',
  'low effort high reward',
  'delulu is the solulu',
  'feral girl summer',
  'cozy chaos',
];

// Playful "live" replacements that rotate
const LIVE_LABELS = [
  'we vibin',
  'no thoughts',
  'lurking',
  'chronically online',
  'unbothered',
  'manifesting',
  'in my era',
  'awake',
];

export default function HomeScreen({ onOpenChat, aiName = 'luna' }) {
  const [activeChannel, setActiveChannel] = useState(null);
  const [editingName, setEditingName]     = useState(false);
  const [tempName, setTempName]           = useState(aiName);
  const [localAiName, setLocalAiName]     = useState(aiName);
  const { theme, accentColor, gradient }  = useTheme();

  // Rotating vibe
  const vibe      = VIBES[new Date().getDate() % VIBES.length];
  const liveLabel = LIVE_LABELS[new Date().getDate() % LIVE_LABELS.length];

  // Pulsing online dot
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Subtle AI card glow animation
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const handleChannel = (channel) => { tap(); setActiveChannel(channel); };
  const handleAI = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onOpenChat(); };

  if (activeChannel) {
    return <ChannelScreen channel={activeChannel} onBack={() => setActiveChannel(null)} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Big greeting block */}
        <View style={styles.headerBlock}>
          <View style={styles.greetingRow}>
            <Text style={[styles.greeting, { color: theme.text }]}>hey</Text>
            <View style={[styles.onlineBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Animated.View style={[styles.onlineDot, { opacity: pulse }]} />
              <Text style={[styles.onlineText, { color: theme.subtext }]}>{liveLabel}</Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>how we feeling today?</Text>

          {/* Vibe of the day */}
          <View style={[styles.vibePill, { borderColor: accentColor + '40' }]}>
            <Text style={[styles.vibeLabel, { color: accentColor }]}>today's vibe</Text>
            <Text style={[styles.vibeText, { color: theme.text }]}>{vibe}</Text>
          </View>
        </View>

        {/* AI Card — full gradient */}
        <Pressable onPress={handleAI} style={({ pressed }) => [styles.aiCardWrap, pressed && { transform: [{ scale: 0.98 }] }]}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiCard}
          >
            <View style={styles.aiCardLeft}>
              <View style={styles.aiIconWrap}>
                <Ionicons name="moon" size={28} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                {editingName ? (
                  <TextInput
                    style={styles.aiNameInput}
                    value={tempName}
                    onChangeText={setTempName}
                    autoFocus
                    onBlur={() => { setLocalAiName(tempName || 'luna'); setEditingName(false); }}
                    onSubmitEditing={() => { setLocalAiName(tempName || 'luna'); setEditingName(false); }}
                    maxLength={20}
                  />
                ) : (
                  <View style={styles.aiNameRow}>
                    <Text style={styles.aiName}>{localAiName}</Text>
                    <TouchableOpacity onPress={() => { tap(); setTempName(localAiName); setEditingName(true); }}>
                      <Ionicons name="pencil" size={13} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={styles.aiDesc}>your ai, here whenever</Text>
              </View>
            </View>
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>spill</Text>
              <Ionicons name="arrow-forward" size={14} color={accentColor} />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Channels */}
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>spaces</Text>
        {channels.map((channel) => (
          <Pressable
            key={channel.id}
            onPress={() => handleChannel(channel)}
            style={({ pressed }) => [
              styles.channelCard,
              { backgroundColor: theme.card, borderColor: theme.border },
              pressed && { transform: [{ scale: 0.98 }], borderColor: accentColor },
            ]}
          >
            <View style={[styles.channelIconWrap, { backgroundColor: accentColor + '20' }]}>
              <Ionicons name={channel.icon} size={20} color={accentColor} />
            </View>
            <View style={styles.channelInfo}>
              <Text style={[styles.channelName, { color: theme.text }]}>{channel.name}</Text>
              <Text style={[styles.channelDesc, { color: theme.subtext }]}>{channel.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
          </Pressable>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  scrollContent:  { paddingHorizontal: 20, paddingTop: 8 },

  // Header
  headerBlock:    { marginBottom: 28 },
  greetingRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting:       { fontSize: 44, fontWeight: '800', letterSpacing: -1.5, lineHeight: 50 },
  subtitle:       { fontSize: 15, marginTop: 4, letterSpacing: -0.2 },

  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    borderWidth: 0.5,
  },
  onlineDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7eddb0' },
  onlineText:     { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  vibePill: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vibeLabel:      { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  vibeText:       { fontSize: 14, fontWeight: '600', flex: 1 },

  // AI Card
  aiCardWrap:     { marginBottom: 32, borderRadius: 24, overflow: 'hidden' },
  aiCard: {
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiCardLeft:     { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  aiIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  aiNameRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiName:         { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  aiNameInput:    {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    minWidth: 80,
    paddingVertical: 2,
  },
  aiDesc:         { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3, letterSpacing: -0.1 },
  aiTag: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  aiTagText:      { fontWeight: '800', fontSize: 13, letterSpacing: -0.2 },

  // Sections
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },

  // Channels
  channelCard: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 0.5,
    gap: 14,
  },
  channelIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  channelInfo:    { flex: 1 },
  channelName:    { fontSize: 16, fontWeight: '700', marginBottom: 2, letterSpacing: -0.2 },
  channelDesc:    { fontSize: 12, letterSpacing: -0.1 },
});