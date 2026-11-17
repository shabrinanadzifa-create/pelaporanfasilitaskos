// ======================================
// KONEKSI DATABASE SUPABASE
// INDAH KOST
// ======================================

const SUPABASE_URL = "https://uiuyijmfjyepxwpdgast.supabase.co";

const SUPABASE_KEY = "sb_publishable_YdtkFxE7wqzPF1C5wJcXqg_N70ag3jV";

// Membuat koneksi Supabase
window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase berhasil dihubungkan!");
