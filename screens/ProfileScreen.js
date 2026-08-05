import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Modal, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';
import { AUTH_REDIRECT_URL } from '../utils/authLinks';

const SUPPORT_EMAIL = 'spillr.support@gmail.com';

const DOCS = {
  privacy: {
    title: 'privacy policy',
    body: [
      'spillr stores the information needed to create and protect your account, including your email address, username, age range, email verification status, login/session data, app preferences, safety onboarding answers, and whether you agreed to the terms, privacy policy, and community guidelines.',
      'spillr stores community activity so the app can work. this can include space messages, daily posts, comments, reports, moderation decisions, warnings, suspensions, bans, deleted-content records, match activity, and safety signals such as repeated rule breaking or harmful wording.',
      'journal entries, mood logs, and private reflections are meant to be personal to your account. in this launch version they are not end-to-end encrypted, so you should not use the journal to store passwords, legal documents, addresses, private contact details, or anything you would not want stored in an app database.',
      'luna chat may be saved on your device and may be processed by AI services so the bot can respond. luna is not a therapist, doctor, crisis worker, or emergency service. do not rely on luna for diagnosis, medical decisions, or urgent safety help.',
      'reports can include the reported message, reporter details, reported user details, reason selected, timestamps, and moderator actions. reports may be reviewed to remove unsafe content, detect repeat abuse, suspend accounts, or ban accounts.',
      'we may remove or limit content when it includes bullying, harassment, hate speech, sexual content, private contact pressure, spam, threats, self-harm encouragement, graphic details, scams, impersonation, or anything that risks user safety.',
      'if you contact support or send feedback, your message, email address, username, and relevant account context may be used to reply, investigate bugs, handle reports, or improve safety.',
      'you can delete your account from settings after password verification. deletion removes your account and the community data covered by the deletion helper, but some safety records may need to stay in backup, logs, or moderation records for abuse prevention and legal/safety reasons.',
      'spillr is built for teens, so privacy and safety matter a lot. still, no online community can promise perfect privacy. do not share your phone number, address, school address, passwords, private photos, financial details, or sensitive identity documents with strangers.',
    ],
  },
  terms: {
    title: 'terms & conditions',
    body: [
      'spillr is a listening-first teen community for users aged 13-19. by creating an account, you agree that you are in the allowed age range and that you will use the app respectfully, honestly, and safely.',
      'spillr is not emergency care, therapy, medical treatment, legal advice, or a replacement for a trusted adult or licensed professional. if someone may be in immediate danger, use local emergency help or the crisis resources in the help tab.',
      'you may not bully, harass, threaten, shame, mock, stalk, impersonate, exploit, manipulate, sexualize, flirt with strangers, request private contact, ask for photos, pressure someone into advice, post explicit content, encourage self-harm, spread hate speech, spam, scam, or use spillr to target another person.',
      'you may not post someone else\'s private information, including phone numbers, addresses, school details, usernames from other platforms, photos, screenshots, health details, family details, or messages shared outside their intended context.',
      'spaces must stay on topic. venting belongs in vent spaces, achievements belong in achievement spaces, school topics belong in school spaces, and unrelated posts may be removed or moved if they disrupt the space.',
      'posts and comments must stay text-first, gentle, non-judgemental, and safe. no unsolicited advice unless someone clearly asks for it. no diagnosing people. no telling someone what they must do with their life, body, relationship, family, health, or safety.',
      'match is for a limited connection, not pressure. you may not use match to demand private contact, flirt with minors, push someone to continue talking, or punish someone for not keeping the match.',
      'reports must be honest. false reporting, mass reporting, revenge reporting, or reporting someone because you dislike them can lead to warnings, limits, suspension, or account ban.',
      'if you break rules, spillr may remove your message, delete your post, delete your comment, hide your content, send a warning, limit you to viewer mode, block posting/commenting/messaging, temporarily suspend your account, permanently ban your account, remove you from matches, or preserve moderation records to stop repeat harm.',
      'serious violations may lead to immediate suspension or permanent ban without multiple warnings. this includes sexual content involving minors, threats, doxxing, grooming behavior, explicit harassment, hate speech, self-harm encouragement, repeated private contact pressure, or attempts to bypass moderation.',
      'public launch users must keep their email verified to participate in spaces, posts, comments, match, and other community features. unverified users may be viewer-only.',
      'we may update these terms as the app grows. continued use after updates means you accept the updated rules.',
    ],
  },
  guidelines: {
    title: 'community guidelines',
    body: [
      'listen first. the default response on spillr is not fixing, judging, debating, diagnosing, or teaching. reflect, comfort, ask what kind of support they want, and give advice only when someone clearly asks.',
      'stay on topic. vent in vent spaces, celebrate in achievement spaces, keep school posts about school, and keep mental health spaces focused on feelings, coping, and support. off-topic messages may be removed.',
      'no bullying or harassment. this includes insults, mocking, name-calling, dogpiling, threats, repeated unwanted messages, targeting someone\'s looks, body, caste, religion, gender, sexuality, class, disability, family, grades, trauma, or mental health.',
      'no hate speech. slurs, dehumanizing language, extremist praise, identity-based attacks, or jokes that make a group unsafe can lead to immediate removal and account restriction.',
      'no flirting, sexual comments, grooming behavior, explicit content, asking for photos, rating bodies, asking relationship/sexual details, or trying to move minors to private platforms.',
      'no private contact pressure. do not ask for phone numbers, addresses, school names, socials, private photos, video calls, or off-app chats. do not guilt someone for saying no.',
      'no judgement or unsolicited advice. do not say things like "you should have", "just do this", "you are overreacting", "your parents are right", or "break up now" unless someone explicitly asked for advice, and even then keep it gentle.',
      'no crisis handling alone. if someone mentions immediate danger, self-harm, suicide, abuse, or feeling unsafe, encourage trusted adults, emergency help, or crisis resources. do not promise secrecy or try to become their only support.',
      'no spam, scams, promotions, repeated copy-paste messages, fake giveaways, external links meant to move users away from spillr, or content made only to get attention.',
      'no impersonation. do not pretend to be another user, a therapist, a moderator, a crisis worker, spillr staff, or someone with authority you do not have.',
      'use reports carefully. report harmful messages or users when something feels unsafe. reported messages can be removed quickly. reported users may receive warnings, restrictions, temporary suspension, or permanent ban depending on severity and repeat behavior.',
      'possible consequences include content removal, comment removal, post removal, message deletion, warning, loss of posting access, loss of commenting access, loss of spaces access, loss of match access, viewer-only mode, temporary suspension, permanent ban, and account deletion in severe cases.',
    ],
  },
};

function isValidUsername(value) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value.trim());
}

export default function ProfileScreen({ username, user, isEmailVerified, onRefreshUser }) {
  const { mode, setMode, theme, accentColor, gradient } = useTheme();
  const [displayUsername, setDisplayUsername] = useState(username || '');
  const [docKey, setDocKey] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftUsername, setDraftUsername] = useState(username || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
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
    if (!currentPassword.trim()) {
      Alert.alert('old password needed', 'enter your current password before choosing a new one.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('too short', 'please use at least 6 characters.');
      return;
    }

    setSavingPassword(true);
    const signIn = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signIn.error) {
      setSavingPassword(false);
      Alert.alert('old password issue', 'that old password did not match.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      Alert.alert('could not update', error.message);
    } else {
      setPasswordOpen(false);
      setCurrentPassword('');
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
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="old password"
              placeholderTextColor={theme.subtext}
              secureTextEntry
            />
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
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.border }]}
              onPress={() => {
                setPasswordOpen(false);
                setCurrentPassword('');
                setNewPassword('');
              }}
            >
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
              <Text style={styles.primaryText}>{deleting ? 'deleting...' : 'delete'}</Text>
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
  logoutBtn: { borderRadius: 20, padding: 17, alignItems: 'center', borderWidth: 1.5, marginTop: 4 },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(24,21,29,0.42)', justifyContent: 'flex-end', padding: 16 },
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
