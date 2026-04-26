import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [aiName, setAiName] = useState('luna');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

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

  if (user && chatOpen) {
    return <ChatScreen aiName={aiName} onBack={() => setChatOpen(false)} />;
  }

  if (user) {
    return <HomeScreen onOpenChat={() => setChatOpen(true)} aiName={aiName} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.logo}>teenspace 🌙</Text>
        <Text style={styles.tagline}>a space that gets you</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.title}>{isLogin ? 'Welcome back' : 'Join the space'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Your age (13-19 only)"
            placeholderTextColor="#666"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            maxLength={2}
          />
        )}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? "New here? Join teenspace" : "Already have an account? Log in"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  form: {
    flex: 2,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  button: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#4a1d96',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    color: '#7c3aed',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});