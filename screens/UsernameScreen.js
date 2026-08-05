import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';

export default function UsernameScreen({ onDone }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, accentColor } = useTheme();

  const handleSubmit = async () => {
    if (username.trim().length < 3) {
      Alert.alert('Too short', 'Username must be at least 3 characters');
      return;
    }
    if (username.trim().length > 20) {
      Alert.alert('Too long', 'Username must be under 20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      Alert.alert('Invalid', 'Only letters, numbers and underscores allowed');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: username.trim().toLowerCase() });

    if (error) {
      if (error.message.includes('duplicate')) {
        Alert.alert('Taken', 'That username is already taken, try another');
      } else {
        Alert.alert('Error', error.message);
      }
    } else {
      onDone(username.trim().toLowerCase());
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.identityIcon, { backgroundColor: accentColor + '24' }]}>
            <Ionicons name="person-circle-outline" size={54} color={accentColor} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>pick your identity</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            this is how everyone will know you.{'\n'}stay anonymous, stay real.
          </Text>

          <TextInput
            style={[styles.input, {
              backgroundColor: theme.input,
              borderColor: username.length > 0 ? accentColor : theme.border,
              color: theme.text,
            }]}
            placeholder="username"
            placeholderTextColor={theme.subtext}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />

          <Text style={[styles.hint, { color: theme.subtext }]}>
            letters, numbers, underscores only
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: accentColor }, (loading || username.trim().length < 3) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading || username.trim().length < 3}
          >
            <Text style={styles.buttonText}>
              {loading ? 'setting up...' : "let's go"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  identityIcon: { width: 82, height: 82, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  input: {
    width: '100%',
    borderRadius: 14,
    padding: 18,
    fontSize: 18,
    borderWidth: 1.5,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  hint: { fontSize: 12, marginBottom: 30 },
  button: { width: '100%', borderRadius: 14, padding: 18, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
