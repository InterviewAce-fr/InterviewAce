import express from 'express';
import { supabase } from '../utils/supabase';
import { emailQueue } from '../worker';
import { logger } from '../utils/logger';

const router = express.Router();

// Register new user (webhook from Supabase)
router.post('/register', async (req, res) => {
  try {
    const { user } = req.body;
    
    if (!user || !user.id || !user.email) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    // Create user profile
    const { error } = await supabase
      .from('user_profiles')
      .insert([{
        id: user.id,
        email: user.email,
        is_premium: false,
        booster_used: false,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      logger.error('Profile creation error:', error);
      throw error;
    }

    // Send welcome email
    await emailQueue.add('send-welcome', {
      email: user.email,
      name: user.user_metadata?.full_name || null
    });

    logger.info(`New user registered: ${user.email}`);
    res.json({ message: 'User registered successfully' });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'auth',
    timestamp: new Date().toISOString()
  });
});

export default router;