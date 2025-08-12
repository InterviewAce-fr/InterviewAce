import { createClient } from 'redis';
import { logger } from './logger';

let redisClient: any = null;

export async function initializeRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL || 'redis://localhost:6379';
    
    if (!process.env.REDIS_URL && !process.env.REDISCLOUD_URL) {
      logger.warn('Redis not configured - background jobs will be disabled');
      return null;
    }
    
    redisClient = createClient({
      url: redisUrl
    });

    redisClient.on('error', (err: Error) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('📦 Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.warn('Failed to initialize Redis - background jobs disabled:', error);
    return null;
  }
}

export function getRedisClient() {
  return redisClient;
}