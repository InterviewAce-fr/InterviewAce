import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Import routes
import authRoutes from './routes/auth';
import preparationRoutes from './routes/preparations';
import pdfRoutes from './routes/pdf';
import stripeRoutes from './routes/stripe';
import uploadRoutes from './routes/upload';
import userRoutes from './routes/users';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { initializeRedis } from './utils/redis';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/preparations', preparationRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize services
async function startServer() {
  try {
    // Initialize Redis connection
    const redis = await initializeRedis();
    if (!redis) {
      logger.warn('⚠️  Starting without Redis - background jobs disabled');
    }
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

startServer();

export default app;