import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Declare supabase at top level to ensure it's always exported
let supabase: any;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn('Missing Supabase configuration - some features will be disabled');
  
  // Create a mock client when Supabase is not configured
  supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { code: 'SUPABASE_NOT_CONFIGURED' } }) }) }),
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Supabase not configured' } }) }) }),
      update: () => ({ eq: async () => ({ error: { message: 'Supabase not configured' } }) }),
      delete: () => ({ eq: async () => ({ error: { message: 'Supabase not configured' } }) })
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } })
    },
    storage: {
      from: () => ({
        upload: async () => ({ error: { message: 'Supabase not configured' } }),
        remove: async () => ({ error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Test connection
  (async () => {
    try {
      await supabase
        .from('user_profiles')
        .select('count', { count: 'exact', head: true });
      logger.info('🗄️  Supabase connected successfully');
    } catch (error: any) {
      logger.error('Supabase connection failed:', error);
    }
  })();
}

// Export at top level outside conditional blocks
export { supabase };