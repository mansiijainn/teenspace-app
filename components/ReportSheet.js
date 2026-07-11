import { StyleSheet, Text, View, Pressable, TextInput, Modal, Alert, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const MONO  = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// Report reasons. 'help' is special — routes to a caring flow, not punitive.
const REASONS = [
  { key: 'bullying',      label: 'bullying or harassment',        icon: 'sad-outline' },
  { key: 'explicit',      label: 'explicit / sexual content',     icon: 'eye-off-outline' },
  { key: 'violence',      label: 'violence or threats',           icon: 'warning-outline' },
  { key: 'guidelines',    label: 'breaks community guidelines',   icon: 'document-text-outline' },
  { key: 'terms',         label: 'breaks terms / privacy',        icon: 'lock-closed-outline' },
  { key: 'impersonation', label: 'impersonation',                 icon: 'person-remove-outline' },
  { key: 'help',          label: 'someone here needs help',       icon: 'heart-outline', special: true },
];

export default function ReportSheet({ visible, onClose, post }) {
  const [selected, setSelected] = useState(null);
  const [details, setDetails]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('pick'); // pick | help | done
  const { theme, accentColor } = useTheme();

  const reset = () => {
    setSelected(null);
    setDetails('');
    setStep('pick');
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const choose = (reason) => {
    Haptics.selectionAsync();
    if (reason.special) {
      // "someone needs help" → caring flow, still logs a report
      setSelected(reason);
      setStep('help');
    } else {
      setSelected(reason);
    }
  };

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('reports').insert({
        reporter_id:      user?.id,
        reported_post_id: post?.id || null,
        reported_user_id: post?.user_id || null,
        reason:           selected.key,
        details:          details.trim() || null,
      });
      if (error) {
        Alert.alert('couldn\'t send', 'something went wrong. try again?');
        setSubmitting(false);
        return;
      }
      setStep('done');
    } catch {
      Alert.alert('couldn\'t send', 'check your connection and try again.');
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {/* PICK A REASON */}
          {step === 'pick' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.title, { color: theme.text, fontFamily: SERIF }]}>report this</Text>
              <Text style={[styles.sub, { color: theme.subtext, fontFamily: MONO }]}>WHAT'S WRONG?</Text>

              {REASONS.map(r => (
                <Pressable
                  key={r.key}
                  onPress={() => choose(r)}
                  style={[
                    styles.reasonRow,
                    { borderColor: selected?.key === r.key ? accentColor : theme.border },
                    r.special && { borderColor: selected?.key === r.key ? accentColor : theme.border, backgroundColor: theme.card },
                  ]}
                >
                  <Ionicons name={r.icon} size={18} color={r.special ? accentColor : theme.subtext} />
                  <Text style={[styles.reasonText, { color: theme.text, fontFamily: SERIF }]}>{r.label}</Text>
                  {selected?.key === r.key && !r.special && (
                    <Ionicons name="checkmark-circle" size={18} color={accentColor} />
                  )}
                </Pressable>
              ))}

              {/* Optional details — only for non-help reports */}
              {selected && !selected.special && (
                <>
                  <Text style={[styles.sub, { color: theme.subtext, fontFamily: MONO, marginTop: 16 }]}>ANYTHING TO ADD? (OPTIONAL)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                    placeholder="more context helps us review faster"
                    placeholderTextColor={theme.subtext}
                    value={details}
                    onChangeText={setDetails}
                    multiline
                    maxLength={300}
                  />
                  <Pressable
                    onPress={submit}
                    disabled={submitting}
                    style={[styles.submitBtn, { backgroundColor: accentColor, opacity: submitting ? 0.6 : 1 }]}
                  >
                    <Text style={[styles.submitText, { fontFamily: SERIF }]}>{submitting ? 'sending...' : 'send report'}</Text>
                  </Pressable>
                </>
              )}

              <Pressable onPress={close} style={styles.cancelBtn}>
                <Text style={[styles.cancelText, { color: theme.subtext, fontFamily: MONO }]}>CANCEL</Text>
              </Pressable>
              <View style={{ height: 20 }} />
            </ScrollView>
          )}

          {/* SOMEONE NEEDS HELP — caring flow */}
          {step === 'help' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Ionicons name="heart" size={40} color={accentColor} style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text style={[styles.title, { color: theme.text, fontFamily: SERIF, textAlign: 'center' }]}>
                thank you for looking out
              </Text>
              <Text style={[styles.helpText, { color: theme.subtext }]}>
                noticing when someone's struggling takes heart. we'll gently check in on them.
                {'\n\n'}
                if they seem in immediate danger, the fastest help is a real person — iCall (9152987821) or emergency 112. you can also point them to the help tab.
                {'\n\n'}
                and hey — sitting with someone else's pain is heavy. take care of you too.
              </Text>
              <Pressable
                onPress={submit}
                disabled={submitting}
                style={[styles.submitBtn, { backgroundColor: accentColor, opacity: submitting ? 0.6 : 1 }]}
              >
                <Text style={[styles.submitText, { fontFamily: SERIF }]}>{submitting ? 'sending...' : 'flag for a gentle check-in'}</Text>
              </Pressable>
              <Pressable onPress={close} style={styles.cancelBtn}>
                <Text style={[styles.cancelText, { color: theme.subtext, fontFamily: MONO }]}>NEVER MIND</Text>
              </Pressable>
              <View style={{ height: 20 }} />
            </ScrollView>
          )}

          {/* DONE */}
          {step === 'done' && (
            <View style={styles.doneWrap}>
              <Ionicons name="checkmark-circle" size={56} color={accentColor} />
              <Text style={[styles.title, { color: theme.text, fontFamily: SERIF, textAlign: 'center', marginTop: 12 }]}>
                {selected?.special ? 'we\'re on it' : 'report sent'}
              </Text>
              <Text style={[styles.helpText, { color: theme.subtext, textAlign: 'center' }]}>
                {selected?.special
                  ? 'thanks for caring. we\'ll check in on them quietly.'
                  : 'thanks for keeping this space safe. we\'ll review it soon.'}
              </Text>
              <Pressable onPress={close} style={[styles.submitBtn, { backgroundColor: accentColor, marginTop: 8 }]}>
                <Text style={[styles.submitText, { fontFamily: SERIF }]}>done</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 0.5, padding: 20, paddingBottom: 30, maxHeight: '85%' },
  handle:     { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:      { fontSize: 26, fontStyle: 'italic', marginBottom: 4 },
  sub:        { fontSize: 10, letterSpacing: 1.8, fontWeight: '700', marginBottom: 12 },
  reasonRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 0.5, borderRadius: 4, marginBottom: 8 },
  reasonText: { flex: 1, fontSize: 16, fontStyle: 'italic' },
  input:      { borderWidth: 0.5, borderRadius: 4, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: 'top', marginBottom: 14 },
  submitBtn:  { paddingVertical: 15, borderRadius: 4, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#f5f1e8', fontSize: 16, fontStyle: 'italic', fontWeight: '600' },
  cancelBtn:  { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  cancelText: { fontSize: 11, letterSpacing: 1.5, fontWeight: '600' },
  helpText:   { fontSize: 14, lineHeight: 22, marginBottom: 16 },
  doneWrap:   { alignItems: 'center', paddingVertical: 20 },
});