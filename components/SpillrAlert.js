import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const listeners = new Set();
let nativeAlert = Alert.alert;
let installed = false;

function normalizeButtons(buttons) {
  if (!Array.isArray(buttons) || !buttons.length) {
    return [{ text: 'okay', style: 'default' }];
  }

  return buttons.map((button) => {
    if (typeof button === 'string') return { text: button, style: 'default' };
    return button || { text: 'okay', style: 'default' };
  });
}

function pickIcon(title = '') {
  const lower = title.toLowerCase();
  if (lower.includes('delete') || lower.includes('remove') || lower.includes('clear') || lower.includes('blocked')) return 'alert-circle';
  if (lower.includes('call') || lower.includes('helpline')) return 'call';
  if (lower.includes('log out')) return 'log-out';
  if (lower.includes('error') || lower.includes('failed') || lower.includes("couldn't")) return 'warning';
  if (lower.includes('permission')) return 'lock-open';
  return 'sparkles';
}

export function installSpillrAlert() {
  if (installed) return;
  installed = true;
  nativeAlert = Alert.alert;

  Alert.alert = (title, message, buttons, options) => {
    const payload = {
      title: String(title || 'spillr'),
      message: message ? String(message) : '',
      buttons: normalizeButtons(buttons),
      options: options || {},
    };

    if (!listeners.size) {
      nativeAlert(payload.title, payload.message, payload.buttons, payload.options);
      return;
    }

    listeners.forEach((listener) => listener(payload));
  };
}

export default function SpillrAlertHost() {
  const [sheet, setSheet] = useState(null);
  const { theme, accentColor, gradient } = useTheme();

  useEffect(() => {
    installSpillrAlert();
    const listener = (payload) => setSheet(payload);
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const close = () => setSheet(null);
  const runAction = (button) => {
    close();
    setTimeout(() => button.onPress?.(), 80);
  };
  const canDismiss = sheet?.options?.cancelable !== false;

  return (
    <Modal
      visible={Boolean(sheet)}
      transparent
      animationType="fade"
      onRequestClose={canDismiss ? close : undefined}
    >
      <Pressable style={styles.backdrop} onPress={canDismiss ? close : undefined}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
          onPress={() => {}}
        >
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>spillr says</Text>
              <Text style={styles.title}>{sheet?.title}</Text>
            </View>
            <View style={styles.iconBubble}>
              <Ionicons name={pickIcon(sheet?.title)} size={20} color="#18151d" />
            </View>
          </LinearGradient>

          {!!sheet?.message && (
            <Text style={[styles.message, { color: theme.subtext }]}>{sheet.message}</Text>
          )}

          <View style={styles.actions}>
            {(sheet?.buttons || []).map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';
              return (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  style={[
                    styles.action,
                    {
                      backgroundColor: isCancel ? theme.input : isDestructive ? '#fee2e2' : theme.text,
                      borderColor: isCancel ? theme.border : 'transparent',
                    },
                  ]}
                  onPress={() => runAction(button)}
                >
                  <Text
                    style={[
                      styles.actionText,
                      { color: isCancel ? theme.text : isDestructive ? '#dc2626' : theme.card },
                    ]}
                  >
                    {button.text || 'okay'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(24,21,29,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 14,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  hero: {
    minHeight: 110,
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroCopy: { flex: 1, paddingRight: 14 },
  kicker: { color: 'rgba(24,21,29,0.56)', fontSize: 13, fontWeight: '800', marginBottom: 6 },
  title: { color: '#18151d', fontSize: 27, lineHeight: 32, fontWeight: '900' },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { fontSize: 14, lineHeight: 21, fontWeight: '700', paddingHorizontal: 4, paddingTop: 14 },
  actions: { gap: 9, marginTop: 16 },
  action: {
    minHeight: 50,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  actionText: { fontSize: 14, fontWeight: '900' },
});
