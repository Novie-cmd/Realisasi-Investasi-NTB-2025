
import { createClient } from '@supabase/supabase-js';

// Menggunakan pengecekan typeof untuk mencegah ReferenceError di browser
const getEnv = (key: string): string => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[key]) || '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Inisialisasi dengan nilai fallback yang aman agar tidak melempar error fatal saat startup
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "SimInvest NTB: Variabel lingkungan Supabase belum dikonfigurasi. " +
    "Aplikasi akan berjalan dalam mode offline/demo menggunakan INITIAL_DATA."
  );
}
