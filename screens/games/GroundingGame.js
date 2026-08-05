import { StyleSheet, Text, View, TouchableOpacity, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

const STEPS = [
  { count: 5, sense: 'see',    prompt: 'name 5 things you can see right now',           icon: 'eye-outline' },
  { count: 4, sense: 'touch',  prompt: 'name 4 things you can feel or touch',           icon: 'hand-left-outline' },
  { count: 3, sense: 'hear',   prompt: 'name 3 things you can hear',                    icon: 'ear-outline' },
  { count: 2, sense: 'smell',  prompt: 'name 2 things you can smell (or could smell)',  icon: 'flower-outline' },
  { count: 1, sense: 'taste',  prompt: 'name 1 thing you can taste',                    icon: 'restaurant-outline' },
];

export default function GroundingGame({ onClose, gradient = ['#c47aff', '#8a5cff'] }) {
  const [stepIdx, setStepIdx]   = useState(0);
  const [answers, setAnswers]   = useState(STEPS.map(s => Array(s.count).fill('')));
  const [done, setDone]         = useState(false);

  const step = STEPS[stepIdx];

  const updateAnswer = (i, val) => {
    setAnswers(prev => prev.map((arr, idx) => idx === stepIdx ? arr.map((v, j) => j === i ? val : v) : arr));
  };

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(stepIdx + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    }
  };

  const back = () => {
    if (stepIdx === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStepIdx(stepIdx - 1);
  };

  const restart = () => {
    setStepIdx(0);
    setAnswers(STEPS.map(s => Array(s.count).fill('')));
    setDone(false);
  };

  const filledCount = answers[stepIdx]?.filter(a => a.trim()).length || 0;
  const canProceed  = filledCount === step?.count;

  if (done) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.doneWrap}>
          <Ionicons name="checkmark-circle" size={70} color="#fff" />
          <Text style={styles.doneTitle}>you're here</Text>
          <Text style={styles.doneSub}>
            grounding helps your nervous system reconnect with the present.{'\n'}
            take a slow breath. you did good.
          </Text>
        </View>
        <View style={styles.bottom}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={restart} style={({ pressed }) => [styles.actionBtn, { flex: 1 }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <Text style={styles.actionText}>again</Text>
            </Pressable>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.actionBtn, styles.actionBtnGhost, { flex: 1 }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <Text style={[styles.actionText, { color: '#fff' }]}>done</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.stepText}>{stepIdx + 1} / {STEPS.length}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={styles.groundingScroll}
        >
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Ionicons name={step.icon} size={32} color="#fff" />
            </View>
            <Text style={styles.bigNumber}>{step.count}</Text>
            <Text style={styles.senseLabel}>things you can {step.sense}</Text>
            <Text style={styles.prompt}>{step.prompt}</Text>

            <View style={styles.inputsWrap}>
              {Array.from({ length: step.count }).map((_, i) => (
                <View key={`${stepIdx}-${i}`} style={styles.inputRow}>
                  <Text style={styles.inputNum}>{i + 1}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="type here"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={answers[stepIdx][i]}
                    onChangeText={(t) => updateAnswer(i, t)}
                    maxLength={50}
                    returnKeyType="done"
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {stepIdx > 0 && (
              <Pressable onPress={back} style={({ pressed }) => [styles.actionBtn, styles.actionBtnGhost, { flex: 0.4 }, pressed && { transform: [{ scale: 0.97 }] }]}>
                <Text style={[styles.actionText, { color: '#fff' }]}>back</Text>
              </Pressable>
            )}
            <Pressable
              onPress={next}
              disabled={!canProceed}
              style={({ pressed }) => [styles.actionBtn, { flex: 1, opacity: canProceed ? 1 : 0.5 }, pressed && canProceed && { transform: [{ scale: 0.97 }] }]}
            >
              <Text style={styles.actionText}>{stepIdx === STEPS.length - 1 ? 'finish' : 'next'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  closeBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  stepText:     { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },

  groundingScroll: { flexGrow: 1, paddingBottom: 18 },
  content:      { paddingHorizontal: 24, paddingTop: 24, alignItems: 'center' },
  iconCircle:   { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bigNumber:    { color: '#fff', fontSize: 80, fontWeight: '900', letterSpacing: -3, lineHeight: 85 },
  senseLabel:   { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 },
  prompt:       { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 },

  inputsWrap:   { width: '100%', gap: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  inputNum:     { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '700', width: 20 },
  input:        { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 12 },

  bottom:       { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  actionBtn: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionBtnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  actionText:   { color: '#1a0d12', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },

  doneWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 16 },
  doneTitle:    { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginTop: 12 },
  doneSub:      { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
