import VibesScreen from './screens/VibesScreen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './supabase';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import UsernameScreen from './screens/UsernameScreen';
import JournalScreen from './screens/JournalScreen';
import HelpScreen from './screens/HelpScreen';

const Tab = createBottomTabNavigator();

const SCREENING_QUESTIONS = [
  {
    id: 'supportIntent',
    title: 'when someone vents, what should happen first?',
    options: [
      { label: 'listen and ask what kind of support they want', value: 'listen' },
      { label: 'tell them exactly what to do', value: 'fix' },
      { label: 'judge whether they handled it right', value: 'judge' },
      { label: 'ask them to move to private chat', value: 'private' },
    ],
    allowed: ['listen'],
  },
  {
    id: 'rantResponse',
    title: 'if someone says "i just need to rant", what is okay?',
    options: [
      { label: 'let them vent without advice or debate', value: 'comfort' },
      { label: 'give a long solution anyway', value: 'advice' },
      { label: 'tell them they are overreacting', value: 'dismiss' },
      { label: 'argue with their feelings', value: 'debate' },
    ],
    allowed: ['comfort'],
  },
  {
    id: 'joiningReason',
    title: 'are you joining mainly to give advice to strangers?',
    options: [
      { label: 'no, i am here to listen, share, and support respectfully', value: 'listen_share' },
      { label: 'yes, people need my advice', value: 'advice_first' },
      { label: 'yes, i like fixing people\'s problems', value: 'fix_people' },
    ],
    allowed: ['listen_share'],
  },
  {
    id: 'rules',
    title: 'what is not allowed here?',
    options: [
      { label: 'asking strangers for photos or private contact', value: 'contact' },
      { label: 'flirting, bullying, judging, or sexual comments', value: 'harm' },
      { label: 'pressuring someone to accept advice', value: 'pressure' },
      { label: 'all of the above', value: 'all' },
    ],
    allowed: ['all'],
  },
  {
    id: 'agreement',
    title: 'TeenSpace is listening-first, not advice-first. do you agree?',
    options: [
      { label: 'i agree to listen first and give advice only when asked', value: 'agree' },
      { label: 'i do not agree', value: 'reject' },
    ],
    allowed: ['agree'],
  },
];

function getScreeningFailure(answers) {
  const failed = SCREENING_QUESTIONS.find((question) => {
    const answer = answers[question.id];
    return !answer || !question.allowed.includes(answer);
  });

  if (!failed) return null;

  return {
    questionId: failed.id,
    reason: 'TeenSpace is a listening-first community. Based on your answers, this may not be the right fit right now.',
  };
}

function MainApp({ username }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [aiName, setAiName] = useState('luna');
  const { theme, accentColor } = useTheme();

  if (chatOpen) {
    return <ChatScreen aiName={aiName} onBack={() => setChatOpen(false)} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.bg,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
          },
          tabBarActiveTintColor: accentColor,
          tabBarInactiveTintColor: theme.subtext,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          options={{
            tabBarLabel: 'spaces',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            ),
          }}
        >
          {() => <HomeScreen onOpenChat={() => setChatOpen(true)} aiName={aiName} />}
        </Tab.Screen>

        <Tab.Screen
          name="Journal"
          options={{
            tabBarLabel: 'journal',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} size={22} color={color} />
            ),
          }}
        >
          {() => <JournalScreen />}
        </Tab.Screen>

        <Tab.Screen
          name="Help"
          options={{
            tabBarLabel: 'help',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={color} />
            ),
          }}
        >
          {() => <HelpScreen />}
        </Tab.Screen>

        <Tab.Screen
          name="Vibes"
          options={{
            tabBarLabel: 'vibes',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={22} color={color} />
            ),
          }}
        >
          {() => <VibesScreen />}
        </Tab.Screen>

        <Tab.Screen
          name="Profile"
          options={{
            tabBarLabel: 'you',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            ),
          }}
        >
          {() => <ProfileScreen username={username} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [signupStep, setSignupStep] = useState('credentials');
  const [screeningAnswers, setScreeningAnswers] = useState({});
  const [rejection, setRejection] = useState(null);
  const [loading, setLoading] = useState(false);
  const { theme, accentColor } = useTheme();

  const resetSignupState = () => {
    setSignupStep('credentials');
    setScreeningAnswers({});
    setRejection(null);
  };

  const validateSignupBasics = () => {
    const ageNum = parseInt(age, 10);

    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Please use at least 6 characters.');
      return false;
    }

    if (Number.isNaN(ageNum) || ageNum < 13 || ageNum > 19) {
      Alert.alert('Sorry', 'Teenspace is only for people aged 13-19.');
      return false;
    }

    return true;
  };

  const sendRejectionNotice = async (failure) => {
    try {
      await supabase.functions.invoke('signup-rejection-email', {
        body: {
          email: email.trim().toLowerCase(),
          reason: failure.reason,
          questionId: failure.questionId,
        },
      });
    } catch {
      // Email delivery depends on a Supabase Edge Function; signup still stays blocked.
    }
  };

  const createAccount = async () => {
    setLoading(true);
    const ageNum = parseInt(age, 10);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          age: ageNum,
          safety_onboarding: {
            completed_at: new Date().toISOString(),
            answers: screeningAnswers,
            agreement: 'listen-first, advice-only-when-asked',
          },
        },
      },
    });

    if (error) Alert.alert('Error', error.message);
    setLoading(false);
  };

  const handleAuth = async () => {
    if (isLogin) {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    if (signupStep === 'credentials') {
      if (validateSignupBasics()) setSignupStep('screening');
      return;
    }

    const failure = getScreeningFailure(screeningAnswers);

    if (failure) {
      setRejection(failure.reason);
      await sendRejectionNotice(failure);
      Alert.alert('Not a fit right now', failure.reason);
      return;
    }

    await createAccount();
  };

  const setScreeningAnswer = (questionId, value) => {
    setScreeningAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetSignupState();
  };

  const renderScreening = () => {
    const allAnswered = SCREENING_QUESTIONS.every((question) => screeningAnswers[question.id]);

    if (rejection) {
      return (
        <View style={styles.rejectionScreen}>
          <Text style={[styles.title, { color: theme.text }]}>not a fit right now</Text>
          <Text style={[styles.screeningIntro, { color: theme.subtext }]}>
            TeenSpace is built for listening-first support, not unsolicited advice, judgement, flirting, or pressure.
          </Text>
          <View style={[styles.rejectionBox, { borderColor: '#dc2626' }]}>
            <Text style={styles.rejectionTitle}>signup could not continue</Text>
            <Text style={styles.rejectionText}>{rejection}</Text>
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: accentColor }]}
            onPress={() => {
              setIsLogin(true);
              resetSignupState();
            }}
          >
            <Text style={styles.buttonText}>back to login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.screeningScroll}
        contentContainerStyle={styles.screeningContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>before you enter</Text>
        <Text style={[styles.screeningIntro, { color: theme.subtext }]}>
          TeenSpace is for strangers to listen without judgement, pressure, flirting, or unsolicited advice.
        </Text>

        {SCREENING_QUESTIONS.map((question) => (
          <View key={question.id} style={[styles.questionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.questionTitle, { color: theme.text }]}>{question.title}</Text>
            {question.options.map((option) => {
              const selected = screeningAnswers[question.id] === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    {
                      borderColor: selected ? accentColor : theme.border,
                      backgroundColor: selected ? accentColor + '22' : theme.input,
                    },
                  ]}
                  onPress={() => setScreeningAnswer(question.id, option.value)}
                >
                  <Text style={[styles.optionText, { color: selected ? accentColor : theme.text }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: accentColor }, (!allAnswered || loading) && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={!allAnswered || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resetSignupState}>
          <Text style={[styles.switchText, { color: accentColor }]}>back to signup</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderCredentials = () => (
    <View style={styles.form}>
      <Text style={[styles.title, { color: theme.text }]}>
        {isLogin ? 'Welcome back' : 'Join the space'}
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
        placeholder="Email"
        placeholderTextColor={theme.subtext}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
        placeholder="Password"
        placeholderTextColor={theme.subtext}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {!isLogin && (
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          placeholder="Your age (13-19 only)"
          placeholderTextColor={theme.subtext}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          maxLength={2}
        />
      )}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: accentColor }, loading && styles.buttonDisabled]}
        onPress={handleAuth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Continue'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={switchMode}>
        <Text style={[styles.switchText, { color: accentColor }]}>
          {isLogin ? "New here? Join teenspace" : "Already have an account? Log in"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style="light" />
      {signupStep === 'credentials' && (
        <View style={styles.header}>
          <Text style={[styles.logo, { color: theme.text }]}>teenspace</Text>
          <Text style={[styles.tagline, { color: theme.subtext }]}>a space that gets you</Text>
        </View>
      )}
      {signupStep === 'screening' && !isLogin ? renderScreening() : renderCredentials()}
    </SafeAreaView>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkUsername(session.user.id);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkUsername(session.user.id);
      else setUsername(null);
    });
  }, []);

  const checkUsername = async (userId) => {
    setCheckingUsername(true);
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    setUsername(data?.username ?? null);
    setCheckingUsername(false);
  };

  if (!user) return <AuthScreen />;
  if (checkingUsername) return null;
  if (!username) return <UsernameScreen onDone={(name) => setUsername(name)} />;
  return <MainApp username={username} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 36, fontWeight: 'bold', letterSpacing: 1 },
  tagline: { fontSize: 14, marginTop: 8 },
  form: { flex: 2, paddingHorizontal: 30 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 30 },
  input: { borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1 },
  button: { borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
  screeningScroll: { flex: 1 },
  screeningContent: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 40 },
  rejectionScreen: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  screeningIntro: { fontSize: 14, lineHeight: 21, marginTop: -18, marginBottom: 20 },
  questionCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  questionTitle: { fontSize: 15, fontWeight: '700', lineHeight: 21, marginBottom: 12 },
  optionButton: { borderRadius: 12, borderWidth: 1, padding: 13, marginBottom: 8 },
  optionText: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  rejectionBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  rejectionTitle: { color: '#dc2626', fontSize: 14, fontWeight: '800', marginBottom: 6 },
  rejectionText: { color: '#dc2626', fontSize: 13, lineHeight: 19 },
});
