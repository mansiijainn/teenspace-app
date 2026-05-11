import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {useState} from 'react';
import { supabase } from '../supabase';
import { useTheme, accents } from '../context/ThemeContext';

const paletteColors = [
    ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6'],
    ['#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e'],
    ['#fca5a5','#fdba74','#fcd34d','#fde68a','#bbf7d0','#99f6e4','#bae6fd','#c7d2fe'],
    ['#7f1d1d','#7c2d12','#78350f','#713f12','#14532d','#134e4a','#0c4a6e','#1e1b4b'],
    ['#ffffff','#d1d5db','#9ca3af','#6b7280','#4b5563','#374151','#1f2937','#000000'],
  ];
  
  export default function ProfileScreen({ username }) {
    const { mode, setMode, accent, setAccent, customColor, theme, accentColor } = useTheme();
    const [showPalette, setShowPalette] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => await supabase.auth.signOut()
      }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: accentColor + '22', borderColor: accentColor }]}>
            <Text style={styles.avatarText}>
              {username?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={[styles.username, { color: theme.text }]}>@{username}</Text>
          <Text style={[styles.bio, { color: theme.subtext }]}>anonymous • teenspace member</Text>
        </View>

        {/* Theme Mode */}
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardLabel, { color: theme.text }]}>mode</Text>
          <View style={styles.toggleRow}>
            {['dark', 'light'].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.toggleBtn, {
                  backgroundColor: mode === m ? accentColor : theme.input,
                  borderColor: mode === m ? accentColor : theme.border,
                }]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.toggleText, { color: mode === m ? '#fff' : theme.subtext }]}>
                  {m === 'dark' ? '🌙 dark' : '☀️ light'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Accent Color */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardLabel, { color: theme.text }]}>accent color</Text>
          <View style={styles.colorRow}>
            {Object.entries(accents).map(([name, color]) => (
              <TouchableOpacity
                key={name}
                style={[styles.colorDot, {
                  backgroundColor: color,
                  borderWidth: accent === name ? 3 : 0,
                  borderColor: '#fff',
                  transform: [{ scale: accent === name ? 1.2 : 1 }]
                }]}
                onPress={() => setAccent(name)}
              />
            ))}
            <TouchableOpacity
              style={[styles.colorDot, {
                backgroundColor: customColor || '#333',
                borderWidth: accent === 'custom' ? 3 : 0,
                borderColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }]}
              onPress={() => setShowPalette(true)}
            >
              <Text style={{ fontSize: 16 }}>🎨</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Full Color Palette Modal */}
        <Modal visible={showPalette} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardLabel, { color: theme.text, marginBottom: 16 }]}>pick any color</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {paletteColors.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.paletteRow}>
                    {row.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[styles.paletteDot, { backgroundColor: color }]}
                        onPress={() => {
                          setCustomColor(color);
                          setAccent('custom');
                          setShowPalette(false);
                        }}
                      />
                    ))}
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: accentColor }]}
                onPress={() => setShowPalette(false)}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: '#dc2626' }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>log out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: '700' },
  username: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  bio: { fontSize: 13 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardLabel: { fontSize: 15, fontWeight: '600', marginBottom: 14 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  toggleText: { fontSize: 14, fontWeight: '600' },
  colorRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  logoutBtn: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    marginTop: 8,
  },
  logoutText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    justifyContent: 'center',
  },
  paletteDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  closeBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
});