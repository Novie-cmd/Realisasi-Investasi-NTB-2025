
import { createClient } from '@supabase/supabase-js';

/**
 * Fungsi utilitas untuk mengambil variabel lingkungan secara aman
 * guna menghindari "Cannot read properties of undefined" di berbagai environment.
 */
const getEnv = (key: string): string => {
  // Cek environment Vite (import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[key];
      if (val) return val;
    }
  } catch (e) {
    // Abaikan jika akses gagal
  }

  // Cek environment Node/Process (process.env)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = (process.env as any)[key];
      if (val) return val;
    }
  } catch (e) {
    // Abaikan jika akses gagal
  }

  return '';
};

// Ambil konfigurasi dengan prioritas prefix VITE_ atau langsung
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

// Verifikasi apakah konfigurasi valid (bukan placeholder atau string kosong)
export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.trim().length > 0
);

/**
 * Inisialisasi Supabase Client. 
 * Jika tidak terkonfigurasi, gunakan URL dummy agar aplikasi tidak crash saat runtime,
 * namun fitur database akan dinonaktifkan secara otomatis di App.tsx.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-ntb.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

if (!isConfigured) {
  console.info(
    "Sistem: Supabase tidak terdeteksi. Aplikasi berjalan menggunakan data lokal (Offline Mode). " +
    "Login menggunakan username 'admin' dan password 'admin' tetap berfungsi secara lokal."
  );
}
