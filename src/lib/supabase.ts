import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Set API base URL for backend calls
if (typeof window !== 'undefined') {
  (window as any).VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
}