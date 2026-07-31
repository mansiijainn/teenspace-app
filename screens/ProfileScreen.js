import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Modal, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useTheme, accents } from '../context/ThemeContext';
import { AUTH_REDIRECT_URL } from '../utils/authLinks';

const SUPPORT_EMAIL = 'spillr.support@gmail.com';

const DOCS = {
  privacy: {
    title: 'privacy policy',
    body: [
      'spillr stores the information needed to run the app: account details, username, community posts, comments, reports, moderation signals, and support messages.',
      'journal entries are private to your account, but they are not end-to-end encrypted in this launch version.',
      'reports and safety signals may be reviewed so harmful content and unsafe accounts can be removed.',
      'you can request account deletion from settings. deletion needs password verification first.',
    ],
  },
  terms: {
    title: 'terms & conditions',
    body: [
      'spillr is a listening-first space. it is not emergency care, therapy, or a replacement for professional support.',
      'do not bully, harass, flirt with strangers, request private contact, post explicit content, pressure people, or give unsolicited advice.',
      'spillr can remove content, limit features, or suspend accounts to protect the community.',
      'public launch users must keep their email verified to participate in spaces and posts.',
    ],
  },
  guidelines: {
    title: 'community guidelines',
    body: [
      'listen first. ask before giving advice.',
      'stay on topic in spaces. vent in rants, celebrate in wins, and keep school/home/mental health posts relevant.',
      'no judgement, hate speech, sexual comments, bullying, spam, or private contact pressure.',
      'if someone may be in danger, encourage them to contact trusted adults or crisis help instead of trying to handle it alone.',
    ],
  },
};

function isValidUsername(value) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value.trim());
}

export default function ProfileScreen({ username, user, isEmailVerified, onRefreshUser }) {
  const { mode, setMode, accent, setAccent, customColor, setCustomColor, theme, accentColor, gradient } = useTheme();
  const [displayUsername, setDisplayUsername] = useState(username || '');
  const [showPalette, setShowPalette] = useState(false);
  const [docKey, setDocKey] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftUsername, setDraftUsername] = useState(username || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDisplayUsername(username || '');
    setDraftUsername(username || '');
  }, [username]);

  const handleLogout = async () => {
    Alert.alert('log out', 'are you sure?', [
      { text: 'cancel', style: 'cancel' },
      {
        text: 'log out',
        style: 'destructive',
        onPress: async () => await supabase.auth.signOut(),
      },
    ]);
  };

  const saveProfile = async () => {
    if (!isValidUsername(draftUsername)) {
      Alert.alert('username issue', 'use 3-20 letters, numbers, or underscores.');
      return;
    }

    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: draftUsername.trim().toLowerCase() });
    setSavingProfile(false);

    if (error) {
      Alert.alert('could not save', error.message.includes('duplicate') ? 'that username is already taken.' : error.message);
      return;
    }

    setEditingProfile(false);
    setDisplayUsername(draftUsername.trim().toLowerCase());
    Alert.alert('profile updated', 'your username is saved.');
  };

  const resendVerification = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: { emailRedirectTo: AUTH_REDIRECT_URL },
    });

    if (error) {
      Alert.alert('could not send', error.message);
    } else {
      Alert.alert('check your email', 'we sent a fresh verification link.');
    }
  };

  const refreshEmailStatus = async () => {
    await onRefreshUser?.();
    Alert.alert('checked', 'if you verified your email, the status will update now.');
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('too short', 'please use at least 6 characters.');
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      Alert.alert('could not update', error.message);
    } else {
      setPasswordOpen(false);
      setNewPassword('');
      Alert.alert('password updated', 'your password has been changed.');
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('password needed', 'enter your password to confirm deletion.');
      return;
    }

    setDeleting(true);
    const signIn = await supabase.auth.signInWithPassword({
      email: user.email,
      password: deletePassword,
    });

    if (signIn.error) {
      setDeleting(false);
      Alert.alert('not verified', 'that password did not match.');
      return;
    }

    const { error } = await supabase.rpc('delete_my_account');
    setDeleting(false);

    if (error) {
      Alert.alert('setup needed', 'run the account deletion SQL in Supabase first, then try again.');
      return;
    }

    setDeleteOpen(false);
    await supabase.auth.signOut();
  };

  const openMail = (subject) => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('spillr username: @' + (displayUsername || ''))}`;
    Linking.openURL(url);
  };

  const currentDoc = docKey ? DOCS[docKey] : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.hero, { backgroundColor: theme.panel }]}>
          <View style={[styles.avatar, { backgroundColor: accentColor, borderColor: theme.card }]}>
            <Text style={styles.avatarText}>{displayUsername?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>account</Text>
            <Text style={styles.heroTitle}>@{displayUsername}</Text>
            <Text style={styles.heroSub}>{isEmailVerified ? 'verified and ready to spill' : 'viewer mode until email is verified'}</Text>
          </View>
        </View>

        <Section title="account" theme={theme}>
          <SettingRow icon="person-outline" title="edit profile" subtitle={`username: @${displayUsername}`} onPress={() => setEditingProfile(true)} theme={theme} accentColor={accentColor} />
          <SettingRow
            icon={isEmailVerified ? 'shield-checkmark-outline' : 'mail-unread-outline'}
            title="email address"
            subtitle={`${user?.email || 'no email'} • ${isEmailVerified ? 'verified' : 'not verified'}`}
            theme={theme}
            accentColor={accentColor}
            rightLabel={isEmailVerified ? 'verified' : 'verify'}
            onPress={isEmailVerified ? refreshEmailStatus : resendVerification}
          />
          <SettingRow icon="key-outline" title="change password" subtitle="update your login password" onPress={() => setPasswordOpen(true)} theme={theme} accentColor={accentColor} />
          <SettingRow icon="trash-outline" title="delete account" subtitle="password verification required" onPress={() => setDeleteOpen(true)} theme={theme} accentColor="#dc2626" />
        </Section>

        <Section title="preferences" theme={theme}>
          <Text style={[styles.cardLabel, { color: theme.text }]}>theme</Text>
          <View style={styles.toggleRow}>
            {[
              ['system', 'system'],
              ['light', 'light'],
              ['dark', 'dark'],
            ].map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.toggleBtn, {
                  backgroundColor: mode === key ? accentColor : theme.input,
                  borderColor: mode === key ? accentColor : theme.border,
                }]}
                onPress={() => setMode(key)}
              >
                <Text style={[styles.toggleText, { color: mode === key ? '#fff' : theme.subtext }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.cardLabel, { color: theme.text, marginTop: 18 }]}>accent color</Text>
          <View style={styles.colorRow}>
            {Object.entries(accents).map(([name, color]) => (
              <TouchableOpacity
                key={name}
                style={[styles.colorDot, {
                  backgroundColor: color,
                  borderWidth: accent === name ? 3 : 0,
                  borderColor: theme.text,
                  transform: [{ scale: accent === name ? 1.16 : 1 }],
                }]}
                onPress={() => setAccent(name)}
              />
            ))}
            <TouchableOpacity
              style={[styles.colorDot, {
                backgroundColor: customColor || '#333',
                borderWidth: accent === 'custom' ? 3 : 0,
                borderColor: theme.text,
                alignItems: 'center',
                justifyContent: 'center',
              }]}
              onPress={() => setShowPalette(true)}
            >
              <Ionicons name="color-palette-outline" size={17} color="#fff" />
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="safety & privacy" theme={theme}>
          <SettingRow icon="document-text-outline" title="privacy policy" subtitle="what spillr stores and why" onPress={() => setDocKey('privacy')} theme={theme} accentColor={accentColor} />
          <SettingRow icon="reader-outline" title="terms & conditions" subtitle="your agreement with spillr" onPress={() => setDocKey('terms')} theme={theme} accentColor={accentColor} />
          <SettingRow icon="heart-circle-outline" title="community guidelines" subtitle="how spaces stay safe" onPress={() => setDocKey('guidelines')} theme={theme} accentColor={accentColor} />
        </Section>

        <Section title="help & support" theme={theme}>
          <SettingRow icon="mail-outline" title="contact us" subtitle={SUPPORT_EMAIL} onPress={() => openMail('contact spillr support')} theme={theme} accentColor={accentColor} />
          <SettingRow icon="flag-outline" title="report a problem" subtitle="bugs, safety issues, or weird behavior" onPress={() => openMail('report a spillr problem')} theme={theme} accentColor={accentColor} />
          <SettingRow icon="chatbox-heart-outline" title="send feedback" subtitle="tell us what felt off or cute" onPress={() => openMail('spillr feedback')} theme={theme} accentColor={accentColor} />
        </Section>

        <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#dc2626' }]} onPress={handleLogout}>
          <Text style={styles.logoutText}>log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showPalette} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardLabel, { color: theme.text, marginBottom: 16 }]}>pick any color</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6'],
                ['#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e'],
                ['#fca5a5','#fdba74','#fcd34d','#fde68a','#bbf7d0','#99f6e4','#bae6fd','#c7d2fe'],
                ['#7f1d1d','#7c2d12','#78350f','#713f12','#14532d','#134e4a','#0c4a6e','#1e1b4b'],
                ['#ffffff','#d1d5db','#9ca3af','#6b7280','#4b5563','#374151','#1f2937','#000000'],
              ].map((row, rowIndex) => (
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
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: accentColor }]} onPress={() => setShowPalette(false)}>
              <Text style={styles.closeText}>close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(currentDoc)} transparent animationType="fade" onRequestClose={() => setDocKey(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.docSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.docHeader}>
              <Text style={[styles.docTitle, { color: theme.text }]}>{currentDoc?.title}</Text>
              <TouchableOpacity onPress={() => setDocKey(null)} style={[styles.roundIcon, { backgroundColor: theme.input }]}>
                <Ionicons name="close" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {currentDoc?.body.map((item) => (
                <Text key={item} style={[styles.docText, { color: theme.subtext }]}>{item}</Text>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={editingProfile} transparent animationType="fade" onRequestClose={() => setEditingProfile(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.docSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.docTitle, { color: theme.text }]}>edit profile</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
              value={draftUsername}
              onChangeText={setDraftUsername}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: accentColor }, savingProfile && styles.disabled]} onPress={saveProfile} disabled={savingProfile}>
              <Text style={styles.primaryText}>{savingProfile ? 'saving...' : 'save profile'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={() => setEditingProfile(false)}>
              <Text style={[styles.secondaryText, { color: theme.text }]}>cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={passwordOpen} transparent animationType="fade" onRequestClose={() => setPasswordOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.docSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.docTitle, { color: theme.text }]}>change password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="new password"
              placeholderTextColor={theme.subtext}
              secureTextEntry
            />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: accentColor }, savingPassword && styles.disabled]} onPress={changePassword} disabled={savingPassword}>
              <Text style={styles.primaryText}>{savingPassword ? 'saving...' : 'update password'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={() => setPasswordOpen(false)}>
              <Text style={[styles.secondaryText, { color: theme.text }]}>cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.docSheet, { backgroundColor: theme.card, borderColor: '#dc2626' }]}>
            <Text style={[styles.docTitle, { color: theme.text }]}>delete account</Text>
            <Text style={[styles.docText, { color: theme.subtext }]}>this removes your account and community data. enter your password to confirm.</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="password"
              placeholderTextColor={theme.subtext}
              secureTextEntry
            />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#dc2626' }, deleting && styles.disabled]} onPress={deleteAccount} disabled={deleting}>
              <Text style={styles.primaryText}>{deleting ? 'deleting...' : 'delete forever'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={() => setDeleteOpen(false)}>
              <Text style={[styles.secondaryText, { color: theme.text }]}>cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Section({ title, theme, children }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.subtext }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
}

function SettingRow({ icon, title, subtitle, onPress, theme, accentColor, rightLabel }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, { backgroundColor: accentColor + '22' }]}>
        <Ionicons name={icon} size={18} color={accentColor} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: theme.subtext }]} numberOfLines={2}>{subtitle}</Text>
      </View>
      {rightLabel ? (
        <Text style={[styles.rightLabel, { color: accentColor }]}>{rightLabel}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={17} color={theme.subtext} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 120 },
  hero: { borderRadius: 32, padding: 20, marginTop: 20, marginBottom: 22, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 72, height: 72, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  avatarText: { color: '#18151d', fontSize: 30, fontWeight: '900' },
  heroCopy: { flex: 1 },
  heroKicker: { color: 'rgba(24,21,29,0.56)', fontSize: 13, fontWeight: '900', marginBottom: 4 },
  heroTitle: { color: '#18151d', fontSize: 24, fontWeight: '900' },
  heroSub: { color: 'rgba(24,21,29,0.66)', fontSize: 12, lineHeight: 17, fontWeight: '800', marginTop: 4 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  card: { borderRadius: 24, padding: 10, borderWidth: 1 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8 },
  rowIcon: { width: 42, height: 42, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '900', marginBottom: 2 },
  rowSubtitle: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  rightLabel: { fontSize: 12, fontWeight: '900' },
  cardLabel: { fontSize: 15, fontWeight: '900', marginBottom: 12, paddingHorizontal: 4 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  toggleText: { fontSize: 13, fontWeight: '900' },
  colorRow: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  logoutBtn: { borderRadius: 20, padding: 17, alignItems: 'center', borderWidth: 1.5, marginTop: 4 },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(24,21,29,0.42)', justifyContent: 'flex-end', padding: 16 },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, maxHeight: '72%' },
  paletteRow: { flexDirection: 'row', gap: 10, marginBottom: 10, justifyContent: 'center' },
  paletteDot: { width: 36, height: 36, borderRadius: 18 },
  closeBtn: { borderRadius: 18, padding: 14, alignItems: 'center', marginTop: 16 },
  closeText: { color: '#fff', fontWeight: '900' },
  docSheet: { borderRadius: 30, borderWidth: 1, padding: 18, maxHeight: '78%' },
  docHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  docTitle: { fontSize: 24, lineHeight: 30, fontWeight: '900', marginBottom: 12 },
  docText: { fontSize: 14, lineHeight: 21, fontWeight: '700', marginBottom: 12 },
  roundIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  input: { borderRadius: 18, borderWidth: 1, padding: 15, fontSize: 15, marginBottom: 12 },
  primaryBtn: { borderRadius: 18, padding: 15, alignItems: 'center', marginTop: 4 },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  secondaryBtn: { borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'center', marginTop: 10 },
  secondaryText: { fontSize: 14, fontWeight: '900' },
  disabled: { opacity: 0.5 },
});
