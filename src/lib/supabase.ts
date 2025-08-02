import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vkwuhfatwvevsxwupzdj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrd3VoZmF0d3ZldnN4d3VwemRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTM5NzQsImV4cCI6MjA2ODY4OTk3NH0.M7klQcxlrktcSKeqFN8LX61ndAuOVwB-il4QpgRuwTs';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder-key';

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

// Create a mock client when Supabase is not configured
const createMockClient = () => ({
  auth: {
    signUp: async () => ({ error: { message: 'Supabase not configured. Please set up your environment variables.' } }),
    signInWithPassword: async () => ({ error: { message: 'Supabase not configured. Please set up your environment variables.' } }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ error: { message: 'Supabase not configured. Please set up your environment variables.' } }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { code: 'PGRST116' } }) }) }),
    insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Supabase not configured' } }) }) }),
    update: () => ({ eq: async () => ({ error: { message: 'Supabase not configured' } }) })
  }),
  storage: {
    from: () => ({
      upload: async () => ({ error: { message: 'Supabase not configured' } }),
      remove: async () => ({ error: { message: 'Supabase not configured' } }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
});

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();