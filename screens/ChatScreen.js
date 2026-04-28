import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef } from "react";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are a warm, empathetic AI companion for teenagers aged 13-19. Your name can be customized by the user.

Your core rules:
- NEVER give unsolicited advice. Only listen, validate, and ask gentle questions.
- If someone asks for advice explicitly, you can give it briefly and kindly.
- Never judge, lecture, or moralize.
- Use casual, natural teen-friendly language.
- Keep responses short (2-4 sentences max).
- If someone mentions self-harm or suicide: respond warmly and share iCall 9152987821.
- You are a friend who listens, not a therapist.`;

export default function ChatScreen({ aiName = "luna", onBack }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `hey 👋 i'm ${aiName}. i'm just here to listen — no judgment. what's on your mind?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      console.log("making API call...");

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: SYSTEM_PROMPT }],
              },
              ...updatedMessages.map((msg) => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
              })),
            ],
          }),
        },
      );

      const data = await response.json();
      console.log("response status:", response.status);
      console.log("data:", data);

      if (!response.ok) {
        throw new Error(data?.error?.message || "API request failed");
      }

      const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiReply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: aiReply },
        ]);

        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 200);
      } else {
        throw new Error("No response from model");
      }
    } catch (error) {
      console.log("ERROR:", error.message);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "sorry, something went wrong 😔",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((msg, i) => (
            <View
              key={i}
              style={[
                styles.bubbleRow,
                msg.role === "user"
                  ? styles.bubbleRowRight
                  : styles.bubbleRowLeft,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  msg.role === "user" ? styles.bubbleUser : styles.bubbleAI,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === "user" && styles.bubbleTextUser,
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.typingBubble}>
              <ActivityIndicator color="#7c3aed" />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="talk to me..."
            placeholderTextColor="#555"
            value={input}
            onChangeText={setInput}
            multiline
          />

          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || loading}
            style={[
              styles.sendButton,
              (!input.trim() || loading) && styles.sendButtonDisabled,
            ]}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080808" },
  keyboardView: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#151515",
  },
  backButton: { width: 60 },
  backText: { color: "#fff" },
  headerCenter: { alignItems: "center" },
  aiName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  aiStatus: { color: "#777", fontSize: 11 },

  messages: { flex: 1, padding: 16 },

  bubbleRow: { flexDirection: "row", marginBottom: 10 },
  bubbleRowRight: { justifyContent: "flex-end" },
  bubbleRowLeft: { justifyContent: "flex-start" },

  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: "#7c3aed",
  },
  bubbleAI: {
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#222",
  },
  bubbleText: { color: "#fff", fontSize: 15 },
  bubbleTextUser: { color: "#fff" },

  typingBubble: {
    padding: 12,
  },

  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#151515",
  },
  input: {
    flex: 1,
    backgroundColor: "#141414",
    borderRadius: 20,
    padding: 12,
    color: "#fff",
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#2a1a4a",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});