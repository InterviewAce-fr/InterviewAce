import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = express.Router();

// Validation schema for scraping request
const scrapeJobSchema = Joi.object({
  url: Joi.string().uri().required()
});

// Scrape job posting from URL
router.post('/job', 
  authenticateToken,
  validateBody(scrapeJobSchema),
  async (req: AuthRequest, res) => {
    try {
      const { url } = req.body;
      
      logger.info(`Scraping job posting from URL: ${url}`);
      
      // In a production environment, you would use:
      // 1. Playwright for web scraping
      // 2. SerpApi for search results
      // 3. Proper error handling and rate limiting
      
      // For now, we'll simulate scraping with a fetch request
      // This is a basic implementation - in production you'd want more robust scraping
      
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        
        // Basic HTML text extraction (in production, use a proper HTML parser)
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        res.json({
          success: true,
          content: textContent,
          url: url
        });
        
      } catch (fetchError) {
        logger.error('Failed to fetch URL:', fetchError);
        
        // Return a helpful error message
        res.status(400).json({
          error: 'Failed to scrape job posting',
          message: 'Unable to access the provided URL. Please check the URL or paste the job description directly.',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        });
      }
      
    } catch (error) {
      logger.error('Scraping error:', error);
      res.status(500).json({
        error: 'Scraping service error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;