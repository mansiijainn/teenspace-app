import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';

const GEMINI_API_KEY = 'YOUR_NEW_GEMINI_KEY_HERE';

const SYSTEM_PROMPT = `You are a warm, empathetic AI companion for teenagers aged 13-19.

Rules:
- Never start with hollow phrases like "oh wow" or "I understand"
- Reflect back what they said first so they feel heard
- Talk like a close friend, casual and real
- NEVER give unsolicited advice, only listen and ask one gentle question
- Keep responses to 2-4 sentences max
- Detect language automatically - if they write Hindi or Hinglish, respond the same way
- If they mention self harm or crisis, share: "please reach out to iCall at 9152987821 💙"`;

export default function ChatScreen({ aiName = 'luna', onBack }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `hey 👋 i'm ${aiName}. no judgment, no unsolicited advice. what's on your mind?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      console.log('making API call...');
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
          }),
        }
      );
      console.log('response status:', response.status);
      const data = await response.json();
      console.log('data:', JSON.stringify(data));
      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiReply) {
        setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
      }
    } catch (error) {
      console.log('ERROR:', error.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "sorry, something went wrong 😔 try again?"
      }]);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.aiName}>{aiName} 🌙</Text>
            <Text style={styles.aiStatus}>here to listen</Text>
          </View>
          <View style={{ width: 60 }} />
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
              style={[
                styles.bubbleRow,
                msg.role === 'user' ? styles.bubbleRowRight : styles.bubbleRowLeft
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>🌙</Text>
                </View>
              )}
              <View style={[
                styles.bubble,
                msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI
              ]}>
                <Text style={[
                  styles.bubbleText,
                  msg.role === 'user' && styles.bubbleTextUser
                ]}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.bubbleRowLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>🌙</Text>
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color="#7c3aed" />
              </View>
            </View>
          )}
          <View style={{ height: 12 }} />
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="talk to me..."
            placeholderTextColor="#555"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#151515',
  },
  backButton: { width: 60 },
  backText: { color: '#7c3aed', fontSize: 15 },
  headerCenter: { alignItems: 'center' },
  aiName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  aiStatus: { color: '#666', fontSize: 11, marginTop: 2 },
  messages: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#120820',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7c3aed',
    marginBottom: 4,
  },
  avatarText: { fontSize: 16 },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: { backgroundColor: '#7c3aed', borderBottomRightRadius: 4 },
  bubbleAI: {
    backgroundColor: '#161616',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#222',
  },
  bubbleText: { color: '#e0e0e0', fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  typingBubble: {
    backgroundColor: '#161616',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#222',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#151515',
    gap: 10,
    alignItems: 'flex-end',
    backgroundColor: '#080808',
  },
  input: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#222',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#7c3aed',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#2a1a4a' },
  sendButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});