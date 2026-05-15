import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';

export default function ChannelScreen({ channel, onBack }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);
  const scrollRef = useRef(null);
  const { theme, accentColor } = useTheme();

  useEffect(() => {
    getCurrentUser();
    fetchPosts();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id);
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    setCurrentUsername(data?.username);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('channel', channel.name)
      .order('created_at', { ascending: true });
    if (!error) setPosts(data);
  };

  const submitPost = async () => {
    if (!newPost.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('posts').insert({
      content: newPost.trim(),
      channel: channel.name,
      user_id: user.id,
      user_email: currentUsername || user.email,
    });
    if (!error) {
      setNewPost('');
      fetchPosts();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    }
    setLoading(false);
  };

  const timeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backText, { color: accentColor }]}>← back</Text>
          </TouchableOpacity>
          <Text style={[styles.channelTitle, { color: theme.text }]}>{channel.emoji} {channel.name}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.posts}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {posts.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>👻</Text>
              <Text style={[styles.emptyText, { color: theme.text }]}>no posts yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.subtext }]}>be the first one to share something</Text>
            </View>
          )}
          {posts.map((post) => {
            const isMe = post.user_id === currentUserId;
            return (
              <View key={post.id} style={[styles.bubbleRow, isMe ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
                {!isMe && (
                  <View style={[styles.avatar, { backgroundColor: accentColor + '22', borderColor: accentColor }]}>
                    <Text style={[styles.avatarText, { color: accentColor }]}>
                      {post.user_email?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[
                  styles.bubble,
                  isMe
                    ? { backgroundColor: accentColor, borderBottomRightRadius: 4 }
                    : { backgroundColor: theme.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.border }
                ]}>
                  {!isMe && (
                    <Text style={[styles.bubbleUser, { color: accentColor }]}>{post.user_email}</Text>
                  )}
                  <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{post.content}</Text>
                  <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{timeAgo(post.created_at)}</Text>
                </View>
              </View>
            );
          })}
          <View style={{ height: 12 }} />
        </ScrollView>

        <View style={[styles.inputContainer, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
            placeholder="say something..."
            placeholderTextColor={theme.subtext}
            value={newPost}
            onChangeText={setNewPost}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.postButton, { backgroundColor: accentColor }, (!newPost.trim() || loading) && styles.postButtonDisabled]}
            onPress={submitPost}
            disabled={!newPost.trim() || loading}
          >
            <Text style={styles.postButtonText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: { width: 60 },
  backText: { fontSize: 15 },
  channelTitle: { fontSize: 17, fontWeight: '600' },
  posts: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { fontSize: 14 },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
  },
  avatarText: { fontSize: 13, fontWeight: '700' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  bubbleText: { color: '#e0e0e0', fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { color: '#666', fontSize: 10, marginTop: 4 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.5)', textAlign: 'right' },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    maxHeight: 100,
  },
  postButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: { opacity: 0.4 },
  postButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});