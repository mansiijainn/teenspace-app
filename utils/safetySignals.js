import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_OPEN_KEY = 'spillr_app_open_state';
const MOOD_LOG_KEY = 'spillr_mood_logs';
const LUNA_QUEUE_KEY = 'spillr_luna_queue';

const NEGATIVE_MOODS = ['low', 'anxious', 'angry', 'numb', 'overwhelmed'];

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(oldDay, newDay) {
  if (!oldDay) return 0;
  const start = new Date(`${oldDay}T00:00:00`);
  const end = new Date(`${newDay}T00:00:00`);
  return Math.round((end - start) / 86400000);
}

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function getStreakNote(streak) {
  if (streak <= 1) return 'no streak pressure. showing up once still counts.';
  if (streak === 2) return 'two tiny check-ins. cute.';
  if (streak < 5) return `${streak} soft check-ins. no pressure to be perfect.`;
  return `${streak} days of coming back to yourself. softly iconic.`;
}

export async function trackAppOpen() {
  const now = new Date();
  const today = dayKey(now);
  const hour = now.getHours();
  const state = await readJson(APP_OPEN_KEY, {
    lastOpenDay: null,
    streak: 0,
  });

  const gap = daysBetween(state.lastOpenDay, today);
  const firstOpenToday = state.lastOpenDay !== today;
  const nextState = {
    lastOpenDay: today,
    streak: firstOpenToday ? (gap === 1 ? state.streak + 1 : 1) : state.streak,
  };

  await writeJson(APP_OPEN_KEY, nextState);

  if (hour >= 0 && hour < 5) {
    return {
      kind: 'late-night',
      title: 'rough night?',
      body: "i'm awake too. no pressure to explain.",
      streakNote: getStreakNote(nextState.streak),
    };
  }

  if (gap >= 2) {
    return {
      kind: 'comeback',
      title: 'no pressure',
      body: 'just thought of you.',
      streakNote: 'breaks are allowed. coming back counts too.',
    };
  }

  if (firstOpenToday) {
    return {
      kind: 'daily',
      title: 'hey',
      body: "you made it through yesterday. that's enough.",
      streakNote: getStreakNote(nextState.streak),
    };
  }

  return {
    kind: 'streak',
    title: 'still here',
    body: getStreakNote(nextState.streak),
    streakNote: null,
  };
}

export async function recordMoodEntry(mood) {
  const logs = await readJson(MOOD_LOG_KEY, []);
  const entry = { mood, createdAt: new Date().toISOString() };
  const recent = [...logs, entry].slice(-60);
  await writeJson(MOOD_LOG_KEY, recent);

  const weekAgo = Date.now() - (7 * 86400000);
  const negativeThisWeek = recent.filter((item) => {
    return NEGATIVE_MOODS.includes(item.mood) && new Date(item.createdAt).getTime() >= weekAgo;
  });

  if (negativeThisWeek.length >= 3) {
    const queue = await readJson(LUNA_QUEUE_KEY, []);
    const alreadyQueued = queue.some((item) => item.type === 'mood-check' && !item.seen);

    if (!alreadyQueued) {
      await writeJson(LUNA_QUEUE_KEY, [
        ...queue,
        {
          type: 'mood-check',
          seen: false,
          createdAt: new Date().toISOString(),
          message: "hey, i noticed this week has been heavy. you don't have to unpack it all, but i'm here if you want to spill a little.",
        },
      ]);
    }
  }
}

export async function takePendingLunaMessages() {
  const queue = await readJson(LUNA_QUEUE_KEY, []);
  const pending = queue.filter((item) => !item.seen);
  const updated = queue.map((item) => ({ ...item, seen: true }));
  await writeJson(LUNA_QUEUE_KEY, updated);
  return pending.map((item) => ({
    role: 'assistant',
    content: item.message,
  }));
}
