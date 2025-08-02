import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    is_premium?: boolean;
  };
}

// Create Supabase client for database operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify JWT token directly
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const userId = decoded.sub;
    const email = decoded.email;

    if (!userId) {
      return res.status(403).json({ error: 'Invalid token payload' });
    }

    // Get user profile from database
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_premium')
      .eq('id', userId)
      .single();

    req.user = {
      id: userId,
      email: email || '',
      is_premium: profile?.is_premium || false
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export function requirePremium(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.is_premium) {
    return res.status(403).json({ 
      error: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED'
    });
  }
  next();
}