import { StyleSheet, Text, View, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { requestPermissions, enableDefaults, savePrefs, rescheduleAll } from '../utils/notifications';

const REMINDERS = [
  {
    key:  'dailyCheckIn',
    icon: 'sunny-outline',
    title: 'daily check-in',
    desc:  'a soft nudge each morning to check on yourself',
    time:  '9:00 am',
  },
  {
    key:  'journalReminder',
    icon: 'book-outline',
    title: 'journal reminder',
    desc:  'an evening invite to write something — even one line',
    time:  '9:00 pm',
  },
  {
    key:  'streakReminder',
    icon: 'flame-outline',
    title: 'streak guardian',
    desc:  'don\'t let your streak slip — gentle reminder if you forget',
    time:  '8:00 pm',
  },
];

export default function NotificationOnboardingScreen({ onDone }) {
  const [selected, setSelected] = useState({
    dailyCheckIn:    true,
    journalReminder: true,
    streakReminder:  true,
  });
  const [loading, setLoading]   = useState(false);
  const { theme, accentColor, gradient } = useTheme();

  const toggle = (key) => {
    Haptics.selectionAsync();
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const enable = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const granted = await requestPermissions();
    if (!granted) {
      // User denied — save prefs as off and continue
      await savePrefs({
        enabled: false,
        dailyCheckIn:    { on: false, hour: 9,  minute: 0 },
        journalReminder: { on: false, hour: 21, minute: 0 },
        streakReminder:  { on: false, hour: 20, minute: 0 },
      });
      setLoading(false);
      onDone();
      return;
    }

    const prefs = {
      enabled: true,
      dailyCheckIn:    { on: selected.dailyCheckIn,    hour: 9,  minute: 0 },
      journalReminder: { on: selected.journalReminder, hour: 21, minute: 0 },
      streakReminder:  { on: selected.streakReminder,  hour: 20, minute: 0 },
    };

    await savePrefs(prefs);
    await rescheduleAll(prefs);
    setLoading(false);
    onDone();
  };

  const skip = async () => {
    Haptics.selectionAsync();
    await savePrefs({
      enabled: false,
      dailyCheckIn:    { on: false, hour: 9,  minute: 0 },
      journalReminder: { on: false, hour: 21, minute: 0 },
      streakReminder:  { on: false, hour: 20, minute: 0 },
    });
    onDone();
  };

  const anySelected = Object.values(selected).some(Boolean);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="notifications" size={32} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>stay in the loop</Text>
          <Text style={styles.heroSub}>pick what you'd like soft reminders for. you can change this anytime.</Text>
        </LinearGradient>

        {/* Reminder toggles */}
        <View style={styles.list}>
          {REMINDERS.map(r => {
            const isOn = selected[r.key];
            return (
              <Pressable
                key={r.key}
                onPress={() => toggle(r.key)}
                style={[
                  styles.row,
                  { backgroundColor: theme.card, borderColor: isOn ? accentColor : theme.border },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: accentColor + '20' }]}>
                  <Ionicons name={r.icon} size={20} color={accentColor} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{r.title}</Text>
                  <Text style={[styles.rowDesc, { color: theme.subtext }]}>{r.desc}</Text>
                  <Text style={[styles.rowTime, { color: accentColor }]}>{r.time}</Text>
                </View>
                <View style={[
                  styles.checkbox,
                  { borderColor: isOn ? accentColor : theme.border, backgroundColor: isOn ? accentColor : 'transparent' },
                ]}>
                  {isOn && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Info note */}
        <View style={[styles.note, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.subtext} />
          <Text style={[styles.noteText, { color: theme.subtext }]}>
            we never spam. just gentle nudges to help you build healthy habits. tweak timing anytime in your profile.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottom}>
        <Pressable
          onPress={enable}
          disabled={loading}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: accentColor, opacity: loading ? 0.6 : 1 },
            pressed && !loading && { transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={styles.btnText}>
            {loading ? 'setting up...' : anySelected ? 'turn on reminders' : 'continue'}
          </Text>
        </Pressable>
        <TouchableOpacity onPress={skip} disabled={loading}>
          <Text style={[styles.skip, { color: theme.subtext }]}>skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  scroll:     { paddingBottom: 20 },

  hero: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    margin: 20,
    borderRadius: 28,
  },
  heroIcon:   { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle:  { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  heroSub:    { color: 'rgba(255,255,255,0.9)', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  list:       { paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  row:        { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, gap: 12 },
  iconWrap:   { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText:    { flex: 1 },
  rowTitle:   { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  rowDesc:    { fontSize: 12, lineHeight: 16, marginTop: 2 },
  rowTime:    { fontSize: 11, fontWeight: '700', marginTop: 4, letterSpacing: 0.3 },
  checkbox:   { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  note:       { flexDirection: 'row', gap: 8, padding: 12, marginHorizontal: 20, borderRadius: 12, borderWidth: 0.5, alignItems: 'flex-start' },
  noteText:   { flex: 1, fontSize: 12, lineHeight: 16, letterSpacing: -0.1 },

  bottom:     { paddingHorizontal: 20, paddingBottom: 20, gap: 14, alignItems: 'center' },
  btn:        { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  skip:       { fontSize: 13, fontWeight: '600' },
});