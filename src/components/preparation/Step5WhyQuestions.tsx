import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';
import Joi from 'joi';
import { Zap, Loader2 } from 'lucide-react';
import { aiService } from '../../lib/aiService';
import { toast } from '../ui/Toast';

const router = express.Router();

// Validation schemas
const createPreparationSchema = Joi.object({
  title: Joi.string().min(1).required(),
  job_url: Joi.string().uri().allow(''),
  step_1_data: Joi.object().default({}),
  step_2_data: Joi.object().default({}),
  step_3_data: Joi.object().default({}),
  step_4_data: Joi.object().default({}),
  step_5_data: Joi.object().default({}),
  step_6_data: Joi.object().default({})
});

const updatePreparationSchema = Joi.object({
  title: Joi.string().min(1),
  job_url: Joi.string().uri().allow(''),
  step_1_data: Joi.object(),
  step_2_data: Joi.object(),
  step_3_data: Joi.object(),
  step_4_data: Joi.object(),
  step_5_data: Joi.object(),
  step_6_data: Joi.object(),
  is_complete: Joi.boolean()
});

interface Step5Data {
}

interface Step5Props {
  data: Step5Data;
  onUpdate: (data: Step5Data) => void;
  cvData?: any; // From Step 4
  jobData?: any; // From Step 1
  swotData?: any; // From Step 3
  matchingResults?: any; // From Step 4
}

const Step5WhyQuestions: React.FC<Step5Props> = ({ 
  data, 
  onUpdate, 
  cvData, 
  jobData, 
  swotData, 
  matchingResults 
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleChange = (field: keyof Step5Data, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  const generateAISuggestions = async () => {
    if (!cvData || !jobData) {
      toast.error('Please complete CV analysis in Step 4 and job analysis in Step 1 first.');
      return;
    }

    setIsGenerating(true);
    
    try {
      const suggestions = await aiService.generateWhySuggestions(
        cvData,
        jobData,
        matchingResults,
        swotData
      );
      
      onUpdate({
        whyCompany: suggestions.whyCompany,
        whyRole: suggestions.whyRole,
        whyYou: suggestions.whyYou
      });
      
      toast.success('AI suggestions generated successfully!');
      
    } catch (error) {
      console.error('Suggestion generation error:', error);
      toast.error('Failed to generate suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

// Get all preparations for user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabase
      .from('preparations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ preparations: data || [] });

  } catch (error) {
    logger.error('Get preparations error:', error);
    res.status(500).json({ error: 'Failed to fetch preparations' });
  }
});

// Get single preparation
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { data, error } = await supabase
      .from('preparations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Preparation not found' });
      }
      throw error;
    }

    res.json({ preparation: data });

  } catch (error) {
    logger.error('Get preparation error:', error);
    res.status(500).json({ error: 'Failed to fetch preparation' });
  }
});

// Create new preparation
router.post('/', 
  authenticateToken,
  validateBody(createPreparationSchema),
  async (req: AuthRequest, res) => {
    try {
      // Log incoming request for debugging
      console.log('POST /api/preparations - Request body:', req.body);
      console.log('POST /api/preparations - User:', req.user);
      
      const userId = req.user!.id;
      const isPremium = req.user!.is_premium;

      // Check if user has reached preparation limit (free users: 1, premium: unlimited)
      if (!isPremium) {
        const { count } = await supabase
          .from('preparations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (count && count >= 1) {
          return res.status(403).json({
            error: 'Free users can only create 1 preparation. Upgrade to Premium for unlimited preparations.',
            code: 'PREPARATION_LIMIT_REACHED'
          });
        }
      }

      const preparationData = {
        ...req.body,
        user_id: userId
      };

      console.log('Inserting preparation data:', preparationData);

      const { data, error } = await supabase
        .from('preparations')
        .insert([preparationData])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ preparation: data });

    } catch (error) {
      logger.error('Create preparation error:', error);
      console.error('Detailed error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create preparation';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// Update preparation
router.put('/:id',
  authenticateToken,
  validateBody(updatePreparationSchema),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const { data, error } = await supabase
        .from('preparations')
        .update({
          ...req.body,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Preparation not found' });
        }
        throw error;
      }

      res.json({ preparation: data });

    } catch (error) {
      logger.error('Update preparation error:', error);
      res.status(500).json({ error: 'Failed to update preparation' });
    }
  }
);

// Delete preparation
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { error } = await supabase
      .from('preparations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Preparation deleted successfully' });

  } catch (error) {
    logger.error('Delete preparation error:', error);
    res.status(500).json({ error: 'Failed to delete preparation' });
  }
});

  const questions = [
        <p className="text-gray-600">
          Prepare compelling answers to the most fundamental interview questions.
        </p>
        
        {/* AI Suggestion Button */}
        <div className="mt-4">
          <button
            onClick={generateAISuggestions}
            disabled={isGenerating || !cvData || !jobData}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
            <span>{isGenerating ? 'Generating AI Suggestions...' : 'Generate AI Suggestions'}</span>
          </button>
          <p className="text-sm text-gray-600 mt-2">
            AI will analyze your profile and job data to suggest personalized answers
          </p>
        </div>
      </div>

      <div className="space-y-8">
  );
};

export default router;