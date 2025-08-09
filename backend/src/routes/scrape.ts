import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { logger } from '../utils/logger';
import Joi from 'joi';
import * as cheerio from 'cheerio';

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
      
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        
        // Use Cheerio to parse HTML and extract text content
        const $ = cheerio.load(html);
        
        // Remove script and style elements
        $('script, style, nav, header, footer, aside').remove();
        
        // Extract main content - try common job posting selectors
        let textContent = '';
        
        // Try common job posting container selectors
        const jobSelectors = [
          '[data-testid="jobsearch-JobComponent"]', // Indeed
          '.job-description', // Generic
          '.jobsearch-jobDescriptionText', // Indeed
          '[data-automation-id="jobPostingDescription"]', // Workday
          '.job-details', // Generic
          '.posting-requirements', // Lever
          '.job-post', // Generic
          'main', // Fallback to main content
          '.content', // Generic content
          '#job-description' // Generic ID
        ];
        
        for (const selector of jobSelectors) {
          const element = $(selector);
          if (element.length > 0) {
            textContent = element.text();
            break;
          }
        }
        
        // If no specific selector worked, get body text
        if (!textContent.trim()) {
          textContent = $('body').text();
        }
        
        // Clean up the text
        textContent = textContent
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();
        
        // Ensure we have meaningful content
        if (textContent.length < 100) {
          throw new Error('Insufficient content extracted from the page');
        }
        
        res.json({
          success: true,
          content: textContent,
          url: url,
          length: textContent.length
        });
        
      } catch (fetchError) {
        logger.error('Failed to fetch URL:', fetchError);
        
        res.status(400).json({
          error: 'Failed to scrape job posting',
          message: 'Unable to access the provided URL. The site may be blocking automated requests or require authentication. Please try copying and pasting the job description directly.',
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