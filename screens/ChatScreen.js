import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

// API key from .env — must be prefixed with EXPO_PUBLIC_ to be accessible in client code
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are Luna, a warm and empathetic AI companion for teenagers aged 13-19 using a mental wellness app called spillr.

How you talk:
- Reflect back what they said first, so they feel heard
- Talk like a close friend — casual, warm, lowercase mostly
- Use 2-4 sentences max, never long lectures
- One gentle question at a time, only if it feels right
- Match their language — if they write Hindi/Hinglish, respond the same way
- Avoid hollow phrases like "I understand" or "that's tough"
- Don't give unsolicited advice — listen first, ask before suggesting anything

If they mention self-harm, suicide, or being in crisis:
- Take it seriously
- Validate their feelings without rushing to fix
- Gently share: "please reach out to iCall at 9152987821 — they get it and they're free"
- For India emergency: 112. For other countries, suggest checking the help tab in the app

Never:
- Diagnose anything
- Replace professional help
- Use therapy jargon like "validate" or "boundaries" unprompted`;

export default function ChatScreen({ aiName = 'luna', onBack }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `hey, i'm ${aiName}. no judgment, no pressure. what's on your mind?`
    }
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const { theme, accentColor } = useTheme();

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    // Catch missing key early
    if (!GEMINI_API_KEY) {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: input.trim() },
        { role: 'assistant', content: 'i\'m not set up yet — the API key is missing. check your .env file.' },
      ]);
      setInput('');
      return;
    }

    const userMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: updatedMessages.map(msg => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            })),
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 200,
            },
          }),
        }
      );

      const data = await response.json();

      // Surface API errors so we can debug
      if (!response.ok) {
        console.log('Gemini API error:', data);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `something's off on my end (${data?.error?.message || response.status}). try again in a sec?`,
        }]);
        return;
      }

      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiReply) {
        setMessages(prev => [...prev, { role: 'assistant', content: aiReply.trim() }]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
      } else {
        // Sometimes safety filters block the response
        console.log('No content in response:', data);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "hmm, i don't have words for that one. wanna say it differently?",
        }]);
      }
    } catch (error) {
      console.log('Network error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "looks like the internet's being weird. try again?",
      }]);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={accentColor} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerNameRow}>
              <View style={[styles.headerAvatar, { backgroundColor: accentColor + '22' }]}>
                <Ionicons name="moon" size={14} color={accentColor} />
              </View>
              <Text style={[styles.aiName, { color: theme.text }]}>{aiName}</Text>
            </View>
            <Text style={[styles.aiStatus, { color: theme.subtext }]}>here to listen</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, index) => (
            <View
              key={index}
              style={[styles.bubbleRow, msg.role === 'user' ? styles.bubbleRowRight : styles.bubbleRowLeft]}
            >
              {msg.role === 'assistant' && (
                <View style={[styles.avatar, { backgroundColor: accentColor + '22', borderColor: accentColor }]}>
                  <Ionicons name="moon" size={14} color={accentColor} />
                </View>
              )}
              <View style={[
                styles.bubble,
                msg.role === 'user'
                  ? { backgroundColor: accentColor, borderBottomRightRadius: 4 }
                  : { backgroundColor: theme.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.border }
              ]}>
                <Text style={[
                  styles.bubbleText,
                  { color: msg.role === 'user' ? '#fff' : theme.text },
                ]}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.bubbleRowLeft}>
              <View style={[styles.avatar, { backgroundColor: accentColor + '22', borderColor: accentColor }]}>
                <Ionicons name="moon" size={14} color={accentColor} />
              </View>
              <View style={[styles.typingBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ActivityIndicator size="small" color={accentColor} />
              </View>
            </View>
          )}
          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
            placeholder="talk to me..."
            placeholderTextColor={theme.subtext}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: accentColor }, (!input.trim() || loading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  keyboardView:     { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton:       { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter:     { alignItems: 'center' },
  headerNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerAvatar:     { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  aiName:           { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  aiStatus:         { fontSize: 11, marginTop: 2 },

  messages:         { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  bubbleRow:        { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  bubbleRowRight:   { justifyContent: 'flex-end' },
  bubbleRowLeft:    { justifyContent: 'flex-start' },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  bubble:           { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleText:       { fontSize: 15, lineHeight: 22, letterSpacing: -0.1 },
  typingBubble:     { borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1 },

  inputContainer:   { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5, gap: 10, alignItems: 'flex-end' },
  input: {
    flex: 1, borderRadius: 22,
    paddingHorizontal: 18, paddingVertical: 12,
    fontSize: 15, borderWidth: 0.5, maxHeight: 100,
  },
  sendButton:       { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.4 },
});
