import express from 'express';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { analyzeCVFromText } from '../services/aiService.server';

const router = express.Router();

async function extractTextFromBuffer(mimetype: string, buf: Buffer): Promise<string> {
  try {
    if (mimetype === 'text/plain') return buf.toString('utf8');

    if (mimetype === 'application/pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buf);
      return data.text || '';
    }

    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const mammothMod: any = await import('mammoth');
      const mammoth = mammothMod.default ?? mammothMod;
      const { value } = await mammoth.convertToHtml({ buffer: buf });
      return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    return '';
  } catch {
    return '';
  }
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (req, file, cb) => {
    const allowedTypes =
      process.env.ALLOWED_FILE_TYPES
        ? process.env.ALLOWED_FILE_TYPES.split(',').map(t => t.trim())
        : [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
          ];

    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type ${file.mimetype} not allowed`));
  }
});

// Upload CV
router.post('/cv', 
  authenticateToken,
  upload.single('cv'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.user!.id;
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${userId}-${uuidv4()}.${fileExt}`;
      const filePath = `cvs/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
          });
        
        if (uploadError) {
          logger.error('File upload error:', uploadError);
          throw uploadError;
        }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Update user profile with CV URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ cv_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        logger.error('Profile update error:', updateError);
        throw updateError;
      }

const { mimetype, buffer, originalname, size } = req.file;

setImmediate(async () => {
  let resumeId: string | null = null;
  try {
    const { data: row, error: insertErr } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        storage_path: filePath,
        url: publicUrl,
        status: 'processing',
        error_message: null,
        extracted_json: null,
        original_filename: originalname,   // ⬅️ utilise les variables capturées
        mimetype,                          // ⬅️
        size_bytes: size                   // ⬅️
      })
      .select('id')
      .single();

    if (insertErr || !row?.id) throw insertErr || new Error('insert resumes failed');
    resumeId = row.id;

    const text = await extractTextFromBuffer(mimetype, buffer); // ⬅️
    if (!text || text.length < 20) {
      await supabase.from('resumes')
        .update({ status: 'error', error_message: 'Text extraction failed or unsupported file type' })
        .eq('id', resumeId);
      return;
    }

    const extracted = await analyzeCVFromText(text);
    await supabase.from('resumes')
      .update({ status: 'done', extracted_json: extracted, error_message: null })
      .eq('id', resumeId);

  } catch (e: any) {
    if (resumeId) {
      await supabase.from('resumes')
        .update({ status: 'error', error_message: e?.message || 'Unknown error' })
        .eq('id', resumeId);
    }
  }
});

// ✅ répondre au client comme avant
res.json({
  message: 'CV uploaded successfully',
  url: publicUrl,
  filename: req.file.originalname,
  size: req.file.size
});

} catch (error) {
  logger.error('CV upload error:', error);
  res.status(500).json({
    error: 'Failed to upload CV',
    message: error instanceof Error ? error.message : 'Unknown error'
  });
}
});
      
// Delete CV
router.delete('/cv', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get current CV URL
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('cv_url')
      .eq('id', userId)
      .single();

    if (!profile?.cv_url) {
      return res.status(404).json({ error: 'No CV found' });
    }

    // Extract file path from URL
    const url = new URL(profile.cv_url);
    const filePath = url.pathname.split('/').slice(-2).join('/');

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('resumes')
      .remove([filePath]);

    if (deleteError) {
      logger.error('File deletion error:', deleteError);
    }

    // Update profile to remove CV URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ cv_url: null })
      .eq('id', userId);

    if (updateError) {
      logger.error('Profile update error:', updateError);
      throw updateError;
    }

    res.json({ message: 'CV deleted successfully' });

  } catch (error) {
    logger.error('CV deletion error:', error);
     console.log('Supabase deletion error details:', error);
    res.status(500).json({ error: 'Failed to delete CV' });
  }
});

export default router;