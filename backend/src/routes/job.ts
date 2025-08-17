import express from 'express';
import Joi from 'joi';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { analyzeJobFromText } from '../services/aiService.server';

const router = express.Router();

const analyzeTextSchema = Joi.object({
  text: Joi.string().min(100).required()
});

router.post(
  '/analyze-text',
  authenticateToken,
  validateBody(analyzeTextSchema),
  async (req: AuthRequest, res) => {
    try {
      const { text } = req.body;
      const result = await analyzeJobFromText(text);
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(500).json({ error: 'Failed to analyze text' });
    }
  }
);

export default router;
