
import { createClient } from '@supabase/supabase-js';

// Ganti nilai ini dengan URL dan Anon Key dari Dashboard Supabase Anda
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseAnonKey = 'your-public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
