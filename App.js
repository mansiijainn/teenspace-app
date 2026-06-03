import VibesScreen from './screens/VibesScreen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
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
  const [loading, setLoading] = useState(false);
  const { theme, accentColor } = useTheme();

  const handleAuth = async () => {
    if (!isLogin) {
      const ageNum = parseInt(age);
      if (ageNum < 13 || ageNum > 19) {
        Alert.alert('Sorry', 'Teenspace is only for people aged 13-19.');
        return;
      }
    }
    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Error', error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { age: parseInt(age) } }
      });
      if (error) Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={[styles.logo, { color: theme.text }]}>teenspace</Text>
        <Text style={[styles.tagline, { color: theme.subtext }]}>a space that gets you</Text>
      </View>
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
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={[styles.switchText, { color: accentColor }]}>
            {isLogin ? "New here? Join teenspace" : "Already have an account? Log in"}
          </Text>
        </TouchableOpacity>
      </View>
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
});