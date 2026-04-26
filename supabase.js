import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(
  'https://oazeoezakqpawcjaacqm.supabase.co',
  'sb_publishable_7xARuLnXHY-6d2ySCE4ZQA_JY6IYbrm',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)