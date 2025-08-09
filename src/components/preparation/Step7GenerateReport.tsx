import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createPreparationSchema = Joi.object({
  title: Joi.string().required(),
  job_url: Joi.string().uri().allow('').default(''),
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

      // Check if user is on free plan and already has a preparation
      const { data: existingPreparations, error: countError } = await supabase
        .from('preparations')
        .select('id')
        .eq('user_id', userId);

      if (countError) throw countError;

      // If user has existing preparations and is on free plan, block creation
      if (existingPreparations && existingPreparations.length > 0) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', userId)
          .single();

        if (!userProfile?.subscription_tier || userProfile.subscription_tier === 'free') {
          return res.status(403).json({
            error: 'Free users can only create 1 preparation. Upgrade to Premium for unlimited preparations.',
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

// Generate PDF report
router.post('/:id/generate-pdf', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Get preparation data
    const { data: preparation, error } = await supabase
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

    // Create HTML content for PDF generation
    const htmlContent = generateHTMLReport(preparation);
    
    // Generate PDF
    const pdfBlob = await generatePDFFromHTML(htmlContent);
    
    // Download the PDF
    const preparationTitle = preparation.title || 'Interview Preparation';
    downloadPDF(pdfBlob, preparationTitle);

    res.json({ message: 'PDF generated successfully' });

  } catch (error) {
    logger.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

const generateHTMLReport = (preparation: any): string => {
  const allStepsData = {
    step1: preparation.step_1_data || {},
    step2: preparation.step_2_data || {},
    step3: preparation.step_3_data || {},
    step4: preparation.step_4_data || {},
    step5: preparation.step_5_data || {},
    step6: preparation.step_6_data || {}
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Interview Preparation Report</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px; }
            .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
            .header p { margin: 10px 0 0 0; font-size: 1.2em; opacity: 0.9; }
            .section { margin-bottom: 40px; }
            .section-title { font-size: 1.8em; font-weight: 600; margin-bottom: 20px; color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
            .subsection { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #3498db; border-radius: 5px; }
            .subsection-title { font-weight: 600; color: #2c3e50; margin-bottom: 8px; }
            .list-item { margin: 8px 0; padding: 8px 12px; background: white; border-radius: 4px; border-left: 3px solid #e74c3c; }
            .elevator-pitch { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
            .canvas-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 20px 0; }
            .canvas-item { padding: 10px; border-radius: 6px; font-size: 12px; min-height: 80px; }
            .canvas-yellow { background: #fef3c7; border: 1px solid #f59e0b; }
            .canvas-orange { background: #fed7aa; border: 1px solid #ea580c; }
            .canvas-red { background: #fecaca; border: 1px solid #dc2626; }
            .canvas-purple { background: #e9d5ff; border: 1px solid #9333ea; }
            .canvas-pink { background: #fce7f3; border: 1px solid #ec4899; }
            .canvas-green { background: #dcfce7; border: 1px solid #16a34a; }
            .canvas-blue { background: #dbeafe; border: 1px solid #2563eb; }
            .canvas-indigo { background: #e0e7ff; border: 1px solid #4f46e5; }
            .canvas-gray { background: #f3f4f6; border: 1px solid #6b7280; }
            .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .swot-item { padding: 15px; border-radius: 8px; }
            .swot-strengths { background: #dcfce7; border: 2px solid #16a34a; }
            .swot-weaknesses { background: #fecaca; border: 2px solid #dc2626; }
            .swot-opportunities { background: #dbeafe; border: 2px solid #2563eb; }
            .swot-threats { background: #fef3c7; border: 2px solid #f59e0b; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${preparation.title || 'Interview Preparation Report'}</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
            <h2 class="section-title">📋 Job Overview</h2>
            ${allStepsData.step1.job_title ? `<div class="subsection"><div class="subsection-title">Job Title:</div>${allStepsData.step1.job_title}</div>` : ''}
            ${allStepsData.step1.company_name ? `<div class="subsection"><div class="subsection-title">Company:</div>${allStepsData.step1.company_name}</div>` : ''}
            ${allStepsData.step1.location ? `<div class="subsection"><div class="subsection-title">Location:</div>${allStepsData.step1.location}</div>` : ''}
            ${allStepsData.step1.salary_range ? `<div class="subsection"><div class="subsection-title">Salary Range:</div>${allStepsData.step1.salary_range}</div>` : ''}
            ${allStepsData.step1.company_description ? `<div class="subsection"><div class="subsection-title">Company Description:</div>${allStepsData.step1.company_description}</div>` : ''}
            ${allStepsData.step1.key_responsibilities?.length ? `
            <div class="subsection">
                <div class="subsection-title">Key Responsibilities:</div>
                ${allStepsData.step1.key_responsibilities.map((resp: string) => `<div class="list-item">${resp}</div>`).join('')}
            </div>` : ''}
        </div>

        <div class="section">
            <h2 class="section-title">🏢 Business Model Canvas</h2>
            <div class="canvas-grid">
                <div class="canvas-item canvas-yellow">
                    <div style="font-weight: bold; margin-bottom: 5px;">Key Partners</div>
                    <div>${allStepsData.step2.key_partners || 'Not specified'}</div>
                </div>
                <div class="canvas-item canvas-orange">
                    <div style="font-weight: bold; margin-bottom: 5px;">Key Activities</div>
                    <div>${allStepsData.step2.key_activities || 'Not specified'}</div>
                </div>
                <div class="canvas-item canvas-red">
                    <div style="font-weight: bold; margin-bottom: 5px;">Value Propositions</div>
                    <div>${allStepsData.step2.value_propositions || 'Not specified'}</div>
                </div>
                <div class="canvas-item canvas-purple">
                    <div style="font-weight: bold; margin-bottom: 5px;">Customer Relationships</div>
                    <div>${allStepsData.step2.customer_relationships || 'Not specified'}</div>
                </div>
                <div class="canvas-item canvas-pink">
                    <div style="font-weight: bold; margin-bottom: 5px;">Customer Segments</div>
                    <div>${allStepsData.step2.customer_segments || 'Not specified'}</div>
                </div>
                <div class="canvas-item canvas-orange">
                    <div style="font-weight: bold; margin-bottom: 5px;">Key Resources</div>
                    <div>${allStepsData.step2.key_resources || 'Not specified'}</div>
                </div>
                <div class="canvas-item canvas-gray" style="grid-column: span 2;">
                    <div style="text-align: center; padding-top: 20px;">
                        <div style="font-weight: bold;">Business Model</div>
                    </div>
                </div>
                <div class="canvas-item canvas-indigo">
                    <div style="font-weight: bold; margin-bottom: 5px;">Channels</div>
                    <div>${allStepsData.step2.channels || 'Not specified'}</div>
                </div>
                <div class="canvas-item canvas-pink">
                    <div style="font-weight: bold; margin-bottom: 5px;">Customer Segments</div>
                    <div>${allStepsData.step2.customer_segments || 'Not specified'}</div>
                </div>
                <div class="canvas-item canvas-green" style="grid-column: span 2;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Cost Structure</div>
                    <div>${allStepsData.step2.cost_structure || 'Not specified'}</div>
                </div>
                <div class="canvas-item canvas-blue" style="grid-column: span 3;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Revenue Streams</div>
                    <div>${allStepsData.step2.revenue_streams || 'Not specified'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">📊 SWOT Analysis</h2>
            <div class="swot-grid">
                <div class="swot-item swot-strengths">
                    <h4 style="font-weight: bold; margin-bottom: 10px;">Strengths</h4>
                    ${allStepsData.step3.strengths?.length ? 
                        allStepsData.step3.strengths.map((item: string) => `<div>• ${item}</div>`).join('') : 
                        '<div style="color: #666;">No strengths identified</div>'
                    }
                </div>
                <div class="swot-item swot-weaknesses">
                    <h4 style="font-weight: bold; margin-bottom: 10px;">Weaknesses</h4>
                    ${allStepsData.step3.weaknesses?.length ? 
                        allStepsData.step3.weaknesses.map((item: string) => `<div>• ${item}</div>`).join('') : 
                        '<div style="color: #666;">No weaknesses identified</div>'
                    }
                </div>
                <div class="swot-item swot-opportunities">
                    <h4 style="font-weight: bold; margin-bottom: 10px;">Opportunities</h4>
                    ${allStepsData.step3.opportunities?.length ? 
                        allStepsData.step3.opportunities.map((item: string) => `<div>• ${item}</div>`).join('') : 
                        '<div style="color: #666;">No opportunities identified</div>'
                    }
                </div>
                <div class="swot-item swot-threats">
                    <h4 style="font-weight: bold; margin-bottom: 10px;">Threats</h4>
                    ${allStepsData.step3.threats?.length ? 
                        allStepsData.step3.threats.map((item: string) => `<div>• ${item}</div>`).join('') : 
                        '<div style="color: #666;">No threats identified</div>'
                    }
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">👤 Your Matching Experience</h2>
            ${allStepsData.step4.role_mission ? `<div class="subsection"><div class="subsection-title">Role Mission & Key Responsibilities:</div>${allStepsData.step4.role_mission}</div>` : ''}
            ${allStepsData.step4.ideal_profile ? `<div class="subsection"><div class="subsection-title">Company's Ideal Profile:</div>${allStepsData.step4.ideal_profile}</div>` : ''}
            ${allStepsData.step4.matching_experiences?.length ? `<div class="subsection"><div class="subsection-title">Your Matching Experience:</div>${allStepsData.step4.matching_experiences.map((exp: string) => `<div class="list-item">${exp}</div>`).join('')}</div>` : ''}
        </div>

        ${allStepsData.step5?.elevator_pitch ? `
        <div class="elevator-pitch">
            <h2 style="margin-bottom: 15px;">🎯 30-Second Elevator Pitch</h2>
            <p style="font-size: 1.1em; line-height: 1.8;">${allStepsData.step5.elevator_pitch}</p>
        </div>` : ''}

        <div class="section">
            <h2 class="section-title">💡 Your Motivation & Questions</h2>
            ${allStepsData.step5.why_this_role ? `<div class="subsection"><div class="subsection-title">Why This Role?</div>${allStepsData.step5.why_this_role}</div>` : ''}
            ${allStepsData.step6.questions_to_ask?.length ? `
            <div class="subsection">
                <div class="subsection-title">Questions to Ask Them:</div>
                ${allStepsData.step6.questions_to_ask.map((q: string) => `<div class="list-item">${q}</div>`).join('')}
            </div>` : ''}
        </div>
    </body>
    </html>
  `;
};

const generatePDFFromHTML = async (htmlContent: string): Promise<Blob> => {
  // Import Puppeteer dynamically
  const puppeteer = await import('puppeteer');
  
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    }
  });
  
  await browser.close();
  
  return new Blob([pdfBuffer], { type: 'application/pdf' });
};

const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.replace(/[^a-zA-Z0-9]/g, '-')}-report.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default router;