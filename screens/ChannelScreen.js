import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

export default function ChannelScreen({ channel, onBack }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    getCurrentUser();
    fetchPosts();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id);
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
      user_email: user.email,
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.channelTitle}>{channel.emoji} {channel.name}</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Posts */}
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
              <Text style={styles.emptyText}>no posts yet</Text>
              <Text style={styles.emptySubtext}>be the first one to share something</Text>
            </View>
          )}
          {posts.map((post) => {
            const isMe = post.user_id === currentUserId;
            return (
              <View key={post.id} style={[styles.bubbleRow, isMe ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
                {!isMe && (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{post.user_email?.[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  {!isMe && (
                    <Text style={styles.bubbleUser}>{post.user_email?.split('@')[0]}</Text>
                  )}
                  <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{post.content}</Text>
                  <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{timeAgo(post.created_at)}</Text>
                </View>
              </View>
            );
          })}
          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="say something..."
            placeholderTextColor="#555"
            value={newPost}
            onChangeText={setNewPost}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.postButton, (!newPost.trim() || loading) && styles.postButtonDisabled]}
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
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  keyboardView: {
    flex: 1,
  },
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
  backText: {
    color: '#7c3aed',
    fontSize: 15,
  },
  channelTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  posts: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: { color: '#555', fontSize: 14 },

  // Bubble styles
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '700',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: '#7c3aed',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#161616',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#222',
  },
  bubbleUser: {
    color: '#7c3aed',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  bubbleText: {
    color: '#e0e0e0',
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextMe: {
    color: '#fff',
  },
  bubbleTime: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'left',
  },
  bubbleTimeMe: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
  },

  // Input
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
  postButton: {
    backgroundColor: '#7c3aed',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#2a1a4a',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});