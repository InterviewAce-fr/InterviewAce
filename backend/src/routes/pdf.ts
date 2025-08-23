import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { generatePDFReport, generateReportHTML } from '../services/pdfService';
import { pdfQueue } from '../worker';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = express.Router();

// Validation schema for PDF generation
const generatePDFSchema = Joi.object({
  preparationData: Joi.object({
    id: Joi.string().required(),
    title: Joi.string().required(),
    job_url: Joi.string().uri().allow(''),
    step_1_data: Joi.object().default({}),
    step_2_data: Joi.object().default({}),
    step_3_data: Joi.object().default({}),
    step_4_data: Joi.object().default({}),
    step_5_data: Joi.object().default({}),
    step_6_data: Joi.object().default({})
  }).required()
});

// Schema for HTML preview
const generateHTMLSchema = Joi.object({
  preparationData: Joi.object({
    id: Joi.string().required(),
    title: Joi.string().required(),
    job_url: Joi.string().uri().allow(''),
    step_1_data: Joi.object().default({}),
    step_2_data: Joi.object().default({}),
    step_3_data: Joi.object().default({}),
    step_4_data: Joi.object().default({}),
    step_5_data: Joi.object().default({}),
    step_6_data: Joi.object().default({})
  }).required(),
  showGenerateButton: Joi.boolean().default(true)
});

// Generate HTML (preview)
router.post(
  '/html',
  authenticateToken,
  validateBody(generateHTMLSchema),
  async (req: AuthRequest, res) => {
    try {
      const { preparationData, showGenerateButton } = req.body;
      const html = await generateReportHTML(preparationData, !!req.user!.is_premium, {
        showGenerateButton,
        frontendUrl: process.env.FRONTEND_URL,
      });
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.send(html);
    } catch (error) {
      logger.error('HTML preview error:', error);
      res.status(500).json({ error: 'Failed to build HTML preview' });
    }
  }
);

// Generate PDF report
router.post('/generate',
  authenticateToken,
  validateBody(generatePDFSchema),
  async (req: AuthRequest, res) => {
    try {
      const { preparationData } = req.body;
      const userId = req.user!.id;
      const isPremium = req.user!.is_premium;

      logger.info(`PDF generation requested by user ${userId}`);

      // Premium -> queue
      if (isPremium) {
        const job = await pdfQueue.add('generate-report', {
          preparationData,
          userId,
          isPremium
        });

        return res.json({
          success: true,
          message: 'PDF generation started. You will receive an email when ready.',
          jobId: job.id
        });
      }

      // Free -> direct buffer
      const pdfBuffer = await generatePDFReport(preparationData, isPremium);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${preparationData.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      logger.error('PDF generation error:', error);
      res.status(500).json({
        error: 'Failed to generate PDF report',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Check PDF generation status (for premium users)
router.get('/status/:jobId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const job = await pdfQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job.progress();

    res.json({
      jobId,
      state,
      progress,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn
    });

  } catch (error) {
    logger.error('PDF status check error:', error);
    res.status(500).json({ error: 'Failed to check PDF status' });
  }
});

export default router;
