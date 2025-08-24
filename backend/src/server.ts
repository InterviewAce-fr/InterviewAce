// charge .env avant tout
import 'dotenv/config';

import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import preparationRoutes from './routes/preparations';
import pdfRoutes from './routes/pdf';
import uploadRoutes from './routes/upload';
import stripeRoutes from './routes/stripe';
import scrapeRoutes from './routes/scrape';
import aiRoutes from './routes/job';
import swotRoutes from './routes/swot';
import businessModelRoutes from './routes/businessModel';
import matchProfileRouter from "./routes/matchProfile";
import whySuggestionsRouter from "./routes/whySuggestions";
import topNewsRouter from "./routes/topNews";

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1); // faire confiance au premier proxy (router Heroku)

// 🔧 CORS / Preflight — DOIT être le tout 1er middleware
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;

  // autorise ton site Netlify + localhost
  const allowed =
    !!origin &&
    (
      origin === process.env.FRONTEND_URL ||
      origin === 'https://startling-salamander-f45eec.netlify.app' ||
      /^https?:\/\/.*\.netlify\.app$/.test(origin) ||
      origin === 'http://localhost:5173'
    );

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');

    // reflète exactement les headers demandés par le navigateur
    const reqHeaders =
      (req.headers['access-control-request-headers'] as string) ||
      'authorization,content-type';
    res.setHeader('Access-Control-Allow-Headers', reqHeaders);

    // debug: permet de vérifier que ce middleware est bien touché
    res.setHeader('X-CORS-MW', 'hit');
  }

  // répondre immédiatement aux préflights
  if (req.method === 'OPTIONS') return res.sendStatus(204);

  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // << ajouter 'unsafe-inline'
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/preparations', preparationRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/scrape', scrapeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai', swotRoutes);
app.use('/api/ai', businessModelRoutes);
app.use('/api/ai', matchProfileRouter);
app.use("/api", whySuggestionsRouter);
app.use("/api/ai", topNewsRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;