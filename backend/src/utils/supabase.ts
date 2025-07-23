import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing Supabase configuration');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
supabase
  .from('user_profiles')
  .select('count', { count: 'exact', head: true })
  .then(() => {
    logger.info('🗄️  Supabase connected successfully');
  })
  .catch((error: any) => {
    logger.error('Supabase connection failed:', error);
  });