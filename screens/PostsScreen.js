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

export default function PostsScreen({ isEmailVerified = false }) {
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
  const canParticipate = Boolean(isEmailVerified);

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
    if (!canParticipate) {
      Alert.alert('verify email first', 'you can read posts for now. verify your email before posting or commenting.');
      return;
    }
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
    if (!canParticipate) {
      Alert.alert('verify email first', 'viewer mode is on until your email is verified.');
      return;
    }

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
        <View style={[styles.headerCard, { backgroundColor: theme.panel }]}>
          <View style={styles.headerTop}>
            <Text style={styles.kicker}>one spill a day</Text>
            <View style={styles.dayPill}>
              <Ionicons name="calendar-outline" size={14} color="#18151d" />
              <Text style={styles.dayPillText}>{todayKey().slice(5)}</Text>
            </View>
          </View>
          <Text style={styles.title}>what do you wish someone would just hear?</Text>
          <Text style={styles.subtitle}>text only. no photos. no advice unless someone asks.</Text>
        </View>

        <View style={[styles.composer, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          {!canParticipate && (
            <View style={[styles.viewerNotice, { backgroundColor: accentColor + '20' }]}>
              <Ionicons name="mail-unread-outline" size={16} color={accentColor} />
              <Text style={[styles.viewerNoticeText, { color: theme.text }]}>
                viewer mode. verify your email before posting.
              </Text>
            </View>
          )}
          <View style={styles.promptRow}>
            <Text style={[styles.promptLabel, { color: theme.subtext }]}>prompt</Text>
            <TouchableOpacity style={[styles.shuffleBtn, { backgroundColor: accentColor + '24' }]} onPress={() => setPromptIndex((promptIndex + 1) % PROMPTS.length)}>
              <Ionicons name="shuffle" size={14} color={accentColor} />
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
            editable={!hasPostedToday && canParticipate}
          />
          <View style={styles.composerBottom}>
            <Text style={[styles.count, { color: theme.subtext }]}>{content.length}/420</Text>
            <TouchableOpacity
              style={[styles.postButton, { backgroundColor: theme.text }, (!content.trim() || hasPostedToday || loading || !canParticipate) && styles.disabled]}
              onPress={submitPost}
              disabled={!content.trim() || hasPostedToday || loading || !canParticipate}
            >
              <Text style={[styles.postButtonText, { color: theme.card }]}>{loading ? 'posting...' : 'post'}</Text>
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
          <View key={post.id} style={[styles.postCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <View style={styles.postTop}>
              <View style={styles.userRow}>
                <View style={[styles.userDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.postUser, { color: theme.text }]}>@{post.user_email}</Text>
              </View>
              <Text style={[styles.postTime, { color: theme.subtext }]}>{timeAgo(post.created_at)}</Text>
            </View>
            <View style={[styles.postPromptPill, { backgroundColor: theme.input }]}>
              <Text style={[styles.postPrompt, { color: theme.subtext }]}>{post.prompt}</Text>
            </View>
            <Text style={[styles.postText, { color: theme.text }]}>{post.content}</Text>

            <View style={[styles.commentsBox, { borderTopColor: theme.border }]}>
              {(comments[post.id] || []).map(comment => (
                <View key={comment.id} style={[styles.comment, { backgroundColor: theme.input }]}>
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
                  editable={canParticipate}
                />
                <TouchableOpacity
                  onPress={() => submitComment(post.id)}
                  style={[styles.commentBtn, { backgroundColor: theme.text }, !canParticipate && styles.disabled]}
                  disabled={!canParticipate}
                >
                  <Ionicons name="send" size={14} color={theme.card} />
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
  scroll: { padding: 20, paddingBottom: 120 },
  headerCard: { borderRadius: 34, padding: 22, marginBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  kicker: { color: 'rgba(24,21,29,0.56)', fontSize: 13, fontWeight: '800' },
  dayPill: { backgroundColor: 'rgba(255,255,255,0.42)', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayPillText: { color: '#18151d', fontSize: 12, fontWeight: '900' },
  title: { color: '#18151d', fontSize: 30, fontWeight: '900', lineHeight: 36 },
  subtitle: { color: 'rgba(24,21,29,0.62)', fontSize: 14, lineHeight: 20, marginTop: 12, fontWeight: '700' },
  composer: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  promptRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  viewerNotice: { borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  viewerNoticeText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  promptLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  shuffleBtn: { borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  shuffle: { fontSize: 12, fontWeight: '900' },
  prompt: { fontSize: 18, fontWeight: '900', lineHeight: 24, marginBottom: 12 },
  input: { minHeight: 112, borderRadius: 24, borderWidth: 1, padding: 16, fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  composerBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  count: { fontSize: 12 },
  postButton: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 11 },
  disabled: { opacity: 0.45 },
  postButtonText: { fontSize: 14, fontWeight: '900' },
  setupCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 14 },
  setupTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  setupText: { fontSize: 13, lineHeight: 19 },
  postCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  postTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 6 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  userDot: { width: 24, height: 24, borderRadius: 12 },
  postUser: { fontSize: 12, fontWeight: '900', flex: 1 },
  postTime: { fontSize: 12 },
  postPromptPill: { borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 10 },
  postPrompt: { fontSize: 12, fontWeight: '800' },
  postText: { fontSize: 16, lineHeight: 24, fontWeight: '700' },
  commentsBox: { borderTopWidth: 1, marginTop: 14, paddingTop: 12 },
  comment: { marginBottom: 10, borderRadius: 18, padding: 10 },
  commentUser: { fontSize: 11, fontWeight: '900', marginBottom: 2 },
  commentText: { fontSize: 14, lineHeight: 20 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  commentInput: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14 },
  commentBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
