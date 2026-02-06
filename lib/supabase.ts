
import { createClient } from '@supabase/supabase-js';

// Fungsi untuk mendapatkan env var dengan dukungan Vite & Process
const getEnv = (key: string): string => {
  // @ts-ignore
  return import.meta.env[key] || (typeof process !== 'undefined' && process.env ? process.env[key] : '') || '';
};

// Coba ambil dengan prefix VITE_ atau langsung
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

// Deteksi apakah ini masih menggunakan nilai placeholder
export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder')
);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-ntb.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

if (!isConfigured) {
  console.error(
    "CRITICAL ERROR: Supabase environment variables are missing! " +
    "Please add SUPABASE_URL and SUPABASE_ANON_KEY to your Vercel Project Settings."
  );
}
