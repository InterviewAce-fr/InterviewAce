import express from 'express';
import Joi from 'joi';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { analyzeJobFromText } from '../services/aiService.server';
import { supabase } from '../utils/supabase';

const router = express.Router();

const analyzeTextSchema = Joi.object({
  text: Joi.string().min(100).required(),
  preparation_id: Joi.string().uuid().optional()
});

router.post(
  '/analyze-text',
  authenticateToken,
  validateBody(analyzeTextSchema),
  async (req: AuthRequest, res) => {
    try {
      const { text, preparation_id } = req.body;
      const result = await analyzeJobFromText(text);

      // Optionally persist company summary into step_1_data for this preparation
      if (preparation_id && result?.company_summary) {
        try {
          // Fetch existing preparation and enforce ownership
          const { data: prep, error: fetchErr } = await supabase
            .from('preparations')
            .select('id,user_id,step_1_data')
            .eq('id', preparation_id)
            .single();
          if (fetchErr) throw fetchErr;
          if (!prep || prep.user_id !== req.user!.id) {
            return res.status(403).json({ error: 'Forbidden' });
          }

          const prev = (prep.step_1_data || {}) as any;
          const updated = {
            ...prev,
            company_name: result.company_name || prev.company_name || '',
            company_summary: result.company_summary || prev.company_summary || ''
          };

          const { error: upErr } = await supabase
            .from('preparations')
            .update({ step_1_data: updated, updated_at: new Date().toISOString() })
            .eq('id', preparation_id)
            .eq('user_id', req.user!.id);

          if (upErr) {
            console.error('[job/analyze-text] Failed to persist company_summary', upErr);
          }
        } catch (persistErr) {
          console.error('[job/analyze-text] Persist error', persistErr);
          // non-fatal
        }
      }

      res.json({ success: true, ...result });
    } catch (e) {
      res.status(500).json({ error: 'Failed to analyze text' });
    }
  }
);

export default router;
