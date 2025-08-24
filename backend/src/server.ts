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
import businessModelRoutes from './routes/businessModel'
import companyHistoryRoutes from "./routes/companyHistory";
import matchProfileRouter from './routes/matchProfile';
import whySuggestionsRouter from "./routes/whySuggestions";
import topNewsRouter from "./routes/topNews";

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1); // faire confiance au premier proxy (router Heroku)

// 🔧 CORS / Preflight — DOIT être le tout 1er middleware
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  const allowList = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

  if (origin && (allowList.length === 0 || allowList.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Vary', 'Origin');

  // méthodes autorisées
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');

  // reflète exactement les headers demandés par le navigateur
  const reqHeaders =
    (req.headers['access-control-request-headers'] as string) ||
    'authorization,content-type';
  res.setHeader('Access-Control-Allow-Headers', reqHeaders);

  // debug: permet de vérifier que ce middleware est bien touché
  res.setHeader('X-CORS-MW', 'hit');

  // répondre immédiatement aux préflights
  if (req.method === 'OPTIONS') return res.sendStatus(204);

  next();
});

// Common middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

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
});
app.use(limiter);

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
app.use("/api/ai", companyHistoryRoutes);

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
