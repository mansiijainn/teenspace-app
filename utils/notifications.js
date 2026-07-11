import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Setup ────────────────────────────────────────────────────────────────────
// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
  }),
});

// ── Permission ───────────────────────────────────────────────────────────────
export async function requestPermissions() {
  if (!Device.isDevice) {
    console.log('Notifications only work on physical devices');
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'TeenSpace reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff7a5c',
    });
  }

  return finalStatus === 'granted';
}

// ── Storage keys ─────────────────────────────────────────────────────────────
const STORAGE_KEY = '@teenspace_notif_prefs';

// Default preferences
const DEFAULT_PREFS = {
  enabled:         false,
  dailyCheckIn:    { on: true,  hour: 9,  minute: 0  },
  journalReminder: { on: true,  hour: 21, minute: 0  },
  streakReminder:  { on: true,  hour: 20, minute: 0  },
};

export async function getPrefs() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function savePrefs(prefs) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

// ── Notification content (rotating messages) ─────────────────────────────────
const CHECK_IN_MESSAGES = [
  { title: 'morning ☼',          body: 'how we feeling today?' },
  { title: 'hey you',             body: 'quick mood check — what\'s the vibe?' },
  { title: 'good morning',        body: 'one word for today?' },
  { title: 'time to check in',    body: 'how\'s your head this morning?' },
];

const JOURNAL_MESSAGES = [
  { title: 'a quiet minute',      body: 'wanna get something off your chest? journal time.' },
  { title: 'tonight\'s thoughts', body: 'jot it down before sleep. even one line counts.' },
  { title: 'before bed',          body: 'small things, big things — they all belong in your journal.' },
  { title: 'evening reset',       body: 'how was today? your journal\'s waiting.' },
];

const STREAK_MESSAGES = [
  { title: 'keep it going',       body: 'your journal streak is on the line. quick entry?' },
  { title: 'don\'t break it now', body: 'you\'ve been showing up. don\'t lose your streak today.' },
  { title: 'one minute, big win', body: 'protect the streak. write something small.' },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── Schedule notifications ───────────────────────────────────────────────────
// We cancel all and reschedule from scratch any time prefs change — keeps state clean.

export async function rescheduleAll(prefs) {
  // Always start from a clean slate
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!prefs.enabled) return;

  // Daily check-in
  if (prefs.dailyCheckIn?.on) {
    const msg = pick(CHECK_IN_MESSAGES);
    await Notifications.scheduleNotificationAsync({
      content: { title: msg.title, body: msg.body, data: { type: 'checkIn' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour:   prefs.dailyCheckIn.hour,
        minute: prefs.dailyCheckIn.minute,
      },
    });
  }

  // Journal reminder
  if (prefs.journalReminder?.on) {
    const msg = pick(JOURNAL_MESSAGES);
    await Notifications.scheduleNotificationAsync({
      content: { title: msg.title, body: msg.body, data: { type: 'journal' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour:   prefs.journalReminder.hour,
        minute: prefs.journalReminder.minute,
      },
    });
  }

  // Streak reminder
  if (prefs.streakReminder?.on) {
    const msg = pick(STREAK_MESSAGES);
    await Notifications.scheduleNotificationAsync({
      content: { title: msg.title, body: msg.body, data: { type: 'streak' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour:   prefs.streakReminder.hour,
        minute: prefs.streakReminder.minute,
      },
    });
  }
}

// ── Convenience: enable everything at once (called from onboarding) ──────────
export async function enableDefaults() {
  const prefs = { ...DEFAULT_PREFS, enabled: true };
  await savePrefs(prefs);
  await rescheduleAll(prefs);
  return prefs;
}

// ── Get count of currently scheduled (useful for debugging) ──────────────────
export async function getScheduledCount() {
  const list = await Notifications.getAllScheduledNotificationsAsync();
  return list.length;
}