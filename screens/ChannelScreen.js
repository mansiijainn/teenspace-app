import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';
import { moderatePost } from '../utils/moderator';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const BOT_MESSAGES = {
  self_harm: "hey, i noticed what you wrote and i just want to check in 💙 you don't have to go through this alone. please reach out to iCall at 9152987821 — they're really good listeners.",
  bullying: "this isn't the kind of space we want to build here. everyone deserves to feel safe. let's keep it kind 🙏",
  hate_speech: "we don't allow hate speech here. this is a space for everyone, regardless of who they are.",
  sexual: "this content isn't appropriate for our community. let's keep this space safe for everyone.",
  spam: "looks like spam! keep it real and authentic here 😊",
  profanity: "hey, let's keep the language a little chill here. we're all friends 👋",
  default: "that post went against our community guidelines. let's keep this a safe space for everyone 💙",
};

function isValidUrl(text) {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

export default function ChannelScreen({ channel, onBack }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
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

  const addBotMessage = async (message) => {
    await supabase.from('posts').insert({
      content: message,
      channel: channel.name,
      user_id: '00000000-0000-0000-0000-000000000000',
      user_email: 'safebot',
      is_bot: true,
    });
    fetchPosts();
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (imageAsset) => {
    setUploadingMedia(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `${user.id}_${Date.now()}.jpg`;

      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      await supabase.from('posts').insert({
        content: '',
        media_url: urlData.publicUrl,
        media_type: 'image',
        channel: channel.name,
        user_id: user.id,
        user_email: currentUsername || user.email,
        is_bot: false,
      });

      fetchPosts();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (error) {
      Alert.alert('Upload failed', 'Could not upload image. Try again.');
      console.log('Upload error:', error);
    }
    setUploadingMedia(false);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const { data: { user } } = await supabase.auth.getUser();
        const file = result.assets[0];
        const fileName = `${user.id}_${Date.now()}_${file.name}`;

        setUploadingMedia(true);

        const response = await fetch(file.uri);
        const blob = await response.blob();

        const { error } = await supabase.storage
          .from('chat-media')
          .upload(fileName, blob, { contentType: file.mimeType });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('chat-media')
          .getPublicUrl(fileName);

        await supabase.from('posts').insert({
          content: file.name,
          media_url: urlData.publicUrl,
          media_type: 'document',
          channel: channel.name,
          user_id: user.id,
          user_email: currentUsername || user.email,
          is_bot: false,
        });

        fetchPosts();
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
        setUploadingMedia(false);
      }
    } catch (error) {
      Alert.alert('Upload failed', 'Could not upload document. Try again.');
      setUploadingMedia(false);
    }
  };

  const submitPost = async () => {
    if (!newPost.trim()) return;
    setLoading(true);

    try {
      const modResult = await moderatePost(newPost.trim());
      const { data: { user } } = await supabase.auth.getUser();

      if (!modResult.safe && modResult.severity === 'high') {
        await supabase.from('violations').insert({
          user_id: user.id,
          reason: modResult.reason,
          post_content: newPost.trim(),
        });
        const botMsg = BOT_MESSAGES[modResult.category] || BOT_MESSAGES.default;
        await addBotMessage(botMsg);

        if (modResult.category === 'self_harm') {
          Alert.alert(
            'hey, we see you 💙',
            "you don't have to go through this alone. please reach out to someone who can help:\n\n🆘 iCall: 9152987821\n🆘 Vandrevala Foundation: 1860-2662-345\n🆘 AASRA: 9820466627",
            [{ text: 'okay, thanks', style: 'cancel' }]
          );
        } else {
          Alert.alert('🚫 post blocked', 'This goes against our community guidelines.', [{ text: 'understood' }]);
        }
        setNewPost('');
        setLoading(false);
        return;
      }

      if (!modResult.safe && modResult.severity === 'medium') {
        await supabase.from('violations').insert({
          user_id: user.id,
          reason: modResult.reason,
          post_content: newPost.trim(),
        });
        await addBotMessage(BOT_MESSAGES[modResult.category] || BOT_MESSAGES.default);
        setNewPost('');
        setLoading(false);
        return;
      }

      if (!modResult.safe && modResult.severity === 'low') {
        await addBotMessage(BOT_MESSAGES[modResult.category] || BOT_MESSAGES.default);
      }

      // Check for links
      const urls = extractUrls(newPost.trim());
      const mediaType = urls.length > 0 ? 'link' : null;
      const mediaUrl = urls.length > 0 ? urls[0] : null;

      await supabase.from('posts').insert({
        content: newPost.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
        channel: channel.name,
        user_id: user.id,
        user_email: currentUsername || user.email,
        is_bot: false,
      });

      setNewPost('');
      fetchPosts();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (error) {
      console.log('Post error:', error);
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

  const renderMediaContent = (post, isMe) => {
    if (post.media_type === 'image' && post.media_url) {
      return (
        <Image
          source={{ uri: post.media_url }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      );
    }

    if (post.media_type === 'document' && post.media_url) {
      return (
        <TouchableOpacity
          style={[styles.docBubble, { borderColor: isMe ? 'rgba(255,255,255,0.3)' : accentColor }]}
          onPress={() => Linking.openURL(post.media_url)}
        >
          <Text style={styles.docIcon}>📄</Text>
          <Text style={[styles.docName, { color: isMe ? '#fff' : accentColor }]} numberOfLines={1}>
            {post.content || 'document'}
          </Text>
          <Text style={[styles.docOpen, { color: isMe ? 'rgba(255,255,255,0.7)' : accentColor }]}>tap to open</Text>
        </TouchableOpacity>
      );
    }

    if (post.media_type === 'link' && post.media_url) {
      return (
        <View>
          {post.content && <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{post.content}</Text>}
          <TouchableOpacity
            style={[styles.linkPreview, { borderColor: isMe ? 'rgba(255,255,255,0.3)' : accentColor }]}
            onPress={() => Linking.openURL(post.media_url)}
          >
            <Text style={styles.linkIcon}>🔗</Text>
            <Text style={[styles.linkUrl, { color: isMe ? 'rgba(255,255,255,0.8)' : accentColor }]} numberOfLines={1}>
              {post.media_url}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return post.content ? (
      <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{post.content}</Text>
    ) : null;
  };

  const renderPost = (post) => {
    const isMe = post.user_id === currentUserId;
    const isBot = post.is_bot || post.user_email === 'safebot';

    if (isBot) {
      return (
        <View key={post.id} style={styles.botRow}>
          <View style={styles.botBubble}>
            <View style={styles.botHeader}>
              <Text style={styles.botIcon}>🛡️</Text>
              <Text style={styles.botName}>safebot</Text>
              <View style={styles.botBadge}>
                <Text style={styles.botBadgeText}>bot</Text>
              </View>
            </View>
            <Text style={styles.botText}>{post.content}</Text>
            <Text style={styles.botTime}>{timeAgo(post.created_at)}</Text>
          </View>
        </View>
      );
    }

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
          {renderMediaContent(post, isMe)}
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{timeAgo(post.created_at)}</Text>
        </View>
      </View>
    );
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
          {posts.map((post) => renderPost(post))}
          <View style={{ height: 112 }} />
        </ScrollView>

        <View style={[styles.inputContainer, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
            placeholder={`stay in ${channel.name}...`}
            placeholderTextColor={theme.subtext}
            value={newPost}
            onChangeText={setNewPost}
            multiline
            maxLength={500}
            editable={!uploadingMedia}
          />
          <TouchableOpacity
            style={[styles.postButton, { backgroundColor: accentColor }, (!newPost.trim() || loading || uploadingMedia) && styles.postButtonDisabled]}
            onPress={submitPost}
            disabled={!newPost.trim() || loading || uploadingMedia}
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
  botRow: { alignItems: 'center', marginBottom: 12, paddingHorizontal: 8 },
  botBubble: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e40af',
    width: '100%',
  },
  botHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  botIcon: { fontSize: 14 },
  botName: { color: '#60a5fa', fontSize: 13, fontWeight: '700' },
  botBadge: { backgroundColor: '#1e40af', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  botBadgeText: { color: '#93c5fd', fontSize: 10, fontWeight: '700' },
  botText: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
  botTime: { color: '#475569', fontSize: 10, marginTop: 6 },
  bubbleRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4, borderWidth: 1 },
  avatarText: { fontSize: 13, fontWeight: '700' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  bubbleText: { color: '#e0e0e0', fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { color: '#666', fontSize: 10, marginTop: 4 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.5)', textAlign: 'right' },
  mediaImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 4 },
  docBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 4 },
  docIcon: { fontSize: 20 },
  docName: { flex: 1, fontSize: 13, fontWeight: '600' },
  docOpen: { fontSize: 11 },
  linkPreview: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 10, borderWidth: 1, marginTop: 6 },
  linkIcon: { fontSize: 14 },
  linkUrl: { flex: 1, fontSize: 12 },
  inputContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, gap: 8, alignItems: 'flex-end' },
  mediaBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  input: { flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, maxHeight: 100 },
  postButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  postButtonDisabled: { opacity: 0.4 },
  postButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
