import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';
import { moderatePost } from '../utils/moderator';

const PROMPTS = [
  'what did you keep inside today?',
  'one tiny thing that felt heavy?',
  'what do you wish someone would just hear?',
  'what are you proud of surviving today?',
  'say the thing without explaining it.',
  'what would you tell your 3am self?',
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function timeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function PostsScreen() {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [content, setContent] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [promptIndex, setPromptIndex] = useState(new Date().getDate() % PROMPTS.length);
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);
  const { theme, accentColor } = useTheme();

  const prompt = PROMPTS[promptIndex];
  const hasPostedToday = posts.some(post => post.user_id === currentUser?.id && post.post_day === todayKey());

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user?.id) {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      setUsername(data?.username || user.email);
    }

    fetchPosts();
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('daily_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      setTableMissing(true);
      return;
    }

    setTableMissing(false);
    setPosts(data || []);
    fetchComments(data || []);
  };

  const fetchComments = async (postList) => {
    const ids = postList.map(post => post.id);
    if (!ids.length) {
      setComments({});
      return;
    }

    const { data, error } = await supabase
      .from('daily_post_comments')
      .select('*')
      .in('post_id', ids)
      .order('created_at', { ascending: true });

    if (error) return;

    const grouped = {};
    (data || []).forEach(comment => {
      if (!grouped[comment.post_id]) grouped[comment.post_id] = [];
      grouped[comment.post_id].push(comment);
    });
    setComments(grouped);
  };

  const submitPost = async () => {
    if (!content.trim() || hasPostedToday || loading) return;
    setLoading(true);

    const modResult = await moderatePost(content.trim());
    if (!modResult.safe && modResult.severity !== 'low') {
      Alert.alert('not posted', 'this one needs to stay off the public feed. try softer wording or use journal instead.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('daily_posts').insert({
      user_id: currentUser.id,
      user_email: username || currentUser.email,
      content: content.trim(),
      prompt,
      post_day: todayKey(),
    });

    if (error) {
      Alert.alert('could not post', 'the posts table may not be set up yet.');
      setTableMissing(true);
    } else {
      setContent('');
      fetchPosts();
    }

    setLoading(false);
  };

  const submitComment = async (postId) => {
    const draft = commentDrafts[postId]?.trim();
    if (!draft) return;

    const modResult = await moderatePost(draft);
    if (!modResult.safe && modResult.severity !== 'low') {
      Alert.alert('not posted', 'comments need to stay gentle and non-judgy.');
      return;
    }

    const { error } = await supabase.from('daily_post_comments').insert({
      post_id: postId,
      user_id: currentUser.id,
      user_email: username || currentUser.email,
      content: draft,
    });

    if (!error) {
      setCommentDrafts(current => ({ ...current, [postId]: '' }));
      fetchComments(posts);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: accentColor }]}>one spill a day</Text>
          <Text style={[styles.title, { color: theme.text }]}>posts</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>text only. no advice unless someone asks.</Text>
        </View>

        <View style={[styles.composer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.promptRow}>
            <Text style={[styles.promptLabel, { color: accentColor }]}>prompt</Text>
            <TouchableOpacity onPress={() => setPromptIndex((promptIndex + 1) % PROMPTS.length)}>
              <Text style={[styles.shuffle, { color: accentColor }]}>shuffle</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.prompt, { color: theme.text }]}>{prompt}</Text>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
            value={content}
            onChangeText={setContent}
            placeholder={hasPostedToday ? 'you already spilled today' : 'spill here...'}
            placeholderTextColor={theme.subtext}
            multiline
            maxLength={420}
            editable={!hasPostedToday}
          />
          <View style={styles.composerBottom}>
            <Text style={[styles.count, { color: theme.subtext }]}>{content.length}/420</Text>
            <TouchableOpacity
              style={[styles.postButton, { backgroundColor: accentColor }, (!content.trim() || hasPostedToday || loading) && styles.disabled]}
              onPress={submitPost}
              disabled={!content.trim() || hasPostedToday || loading}
            >
              <Text style={styles.postButtonText}>{loading ? 'posting...' : 'post'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {tableMissing && (
          <View style={[styles.setupCard, { borderColor: accentColor + '66', backgroundColor: theme.card }]}>
            <Text style={[styles.setupTitle, { color: theme.text }]}>posts need setup</Text>
            <Text style={[styles.setupText, { color: theme.subtext }]}>
              create `daily_posts` and `daily_post_comments` in Supabase to turn this feed on.
            </Text>
          </View>
        )}

        {posts.map(post => (
          <View key={post.id} style={[styles.postCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.postTop}>
              <Text style={[styles.postUser, { color: accentColor }]}>@{post.user_email}</Text>
              <Text style={[styles.postTime, { color: theme.subtext }]}>{timeAgo(post.created_at)}</Text>
            </View>
            <Text style={[styles.postPrompt, { color: theme.subtext }]}>{post.prompt}</Text>
            <Text style={[styles.postText, { color: theme.text }]}>{post.content}</Text>

            <View style={[styles.commentsBox, { borderTopColor: theme.border }]}>
              {(comments[post.id] || []).map(comment => (
                <View key={comment.id} style={styles.comment}>
                  <Text style={[styles.commentUser, { color: accentColor }]}>@{comment.user_email}</Text>
                  <Text style={[styles.commentText, { color: theme.text }]}>{comment.content}</Text>
                </View>
              ))}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={[styles.commentInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                  value={commentDrafts[post.id] || ''}
                  onChangeText={(text) => setCommentDrafts(current => ({ ...current, [post.id]: text }))}
                  placeholder="soft comment..."
                  placeholderTextColor={theme.subtext}
                  maxLength={180}
                />
                <TouchableOpacity onPress={() => submitComment(post.id)} style={[styles.commentBtn, { backgroundColor: accentColor }]}>
                  <Ionicons name="send" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 18 },
  kicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.7, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 42, fontWeight: '900', letterSpacing: -1.4 },
  subtitle: { fontSize: 14, marginTop: 4 },
  composer: { borderRadius: 24, borderWidth: 1, padding: 16, marginBottom: 18 },
  promptRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  promptLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3 },
  shuffle: { fontSize: 12, fontWeight: '800' },
  prompt: { fontSize: 17, fontWeight: '800', lineHeight: 23, marginBottom: 12 },
  input: { minHeight: 96, borderRadius: 18, borderWidth: 1, padding: 14, fontSize: 15, lineHeight: 21, textAlignVertical: 'top' },
  composerBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  count: { fontSize: 12 },
  postButton: { borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10 },
  disabled: { opacity: 0.45 },
  postButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  setupCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 14 },
  setupTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  setupText: { fontSize: 13, lineHeight: 19 },
  postCard: { borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 14 },
  postTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 6 },
  postUser: { fontSize: 12, fontWeight: '900' },
  postTime: { fontSize: 12 },
  postPrompt: { fontSize: 12, marginBottom: 8, fontStyle: 'italic' },
  postText: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  commentsBox: { borderTopWidth: 1, marginTop: 14, paddingTop: 12 },
  comment: { marginBottom: 10 },
  commentUser: { fontSize: 11, fontWeight: '900', marginBottom: 2 },
  commentText: { fontSize: 14, lineHeight: 20 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  commentInput: { flex: 1, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  commentBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
