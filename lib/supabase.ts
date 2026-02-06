
import { createClient } from '@supabase/supabase-js';

/**
 * Konfigurasi Supabase untuk Produksi
 * Pastikan Anda telah menambahkan SUPABASE_URL dan SUPABASE_ANON_KEY 
 * di menu Settings > Environment Variables pada Dashboard Vercel Anda.
 */

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "PERINGATAN: Supabase URL atau Anon Key tidak ditemukan. " +
    "Pastikan variabel lingkungan SUPABASE_URL dan SUPABASE_ANON_KEY sudah terpasang."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
