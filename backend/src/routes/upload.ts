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
  } catch (e) {
    logger.error('Text extraction error:', e);
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
router.post(
  '/cv',
  authenticateToken,
  upload.single('cv'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.user!.id;
      const { mimetype, buffer, originalname, size } = req.file;

      const fileExt = originalname.includes('.') ? originalname.split('.').pop() : 'bin';
      const fileName = `${uuidv4()}.${fileExt}`;
      // chemin “par utilisateur” (plus propre pour les policies)
      const filePath = `cvs/${userId}/${fileName}`;

      // 1) Upload Storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, buffer, {
          contentType: mimetype
        });

      if (uploadError) {
        logger.error('File upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload to storage' });
      }

      // 2) Public URL
      const {
        data: { publicUrl }
      } = supabase.storage.from('resumes').getPublicUrl(filePath);

      // 3) Update user_profiles (forçons RETURNING pour savoir si une ligne a été touchée)
      const { data: updatedProfiles, error: updateProfileErr } = await supabase
        .from('user_profiles')
        .update({ cv_url: publicUrl })
        .eq('id', userId)
        .select('id');

      if (updateProfileErr) {
        logger.error('Profile update error:', updateProfileErr);
        return res.status(500).json({ error: 'Failed to update user profile' });
      }
      if (!updatedProfiles?.length) {
        logger.warn(`No user_profiles row updated for user ${userId}`);
      }

      // 4) Créer la ligne "resumes" (extracted_json: {} pour éviter NOT NULL)
      const { data: resumeRow, error: resumeInsertErr } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          storage_path: filePath,
          original_filename: originalname,
          mime_type: mimetype,   // ✅ correspond au schéma
          size_bytes: size,      // ✅ colonne existante
          status: 'extracting',  // ✅ valeur autorisée
          error_message: null,
          extracted_json: null
        })
        .select('id')
        .single();

      if (resumeInsertErr || !resumeRow?.id) {
        logger.error('Insert resumes error:', resumeInsertErr);
        return res.status(500).json({ error: 'Failed to create resume record' });
      }
      const resumeId = resumeRow.id;

      // 5) Extraction de texte
      const text = await extractTextFromBuffer(mimetype, buffer);
      if (!text || text.length < 20) {
        await supabase
          .from('resumes')
          .update({ status: 'failed', error_message: 'Text extraction failed or unsupported file type' })
          .eq('id', resumeId);

        return res.status(422).json({ error: 'Text extraction failed or unsupported file type' });
      }

      // 6) Analyse IA (nécessite OPENAI_API_KEY en config)
      const extracted = await analyzeCVFromText(text);

      // 7) Mettre à jour le statut + stocker l’extraction
      const { error: readyErr } = await supabase
        .from('resumes')
        .update({
          status: 'ready',
          error_message: null,
          extracted_json: extracted
        })
        .eq('id', resumeId);

      if (readyErr) {
        logger.error('Update resume status error:', readyErr);
      }

      // 8) Désactiver anciens profils + insérer le nouveau
      const { error: deactivateErr } = await supabase
        .from('resume_profiles')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (deactivateErr) {
        logger.error('Deactivate old profiles error:', deactivateErr);
      }

      const { error: insertProfileErr } = await supabase.from('resume_profiles').insert({
        resume_id: resumeId,
        user_id: userId,
        language: 'en', // ajuster si besoin
        person: extracted.person ?? {},
        education: extracted.education ?? [],
        experience: extracted.experience ?? [],
        skills: extracted.skills ?? [],
        raw_data: {
          achievements: extracted.achievements ?? [],
          source: 'upload.ts',
          model: 'gpt-4o-mini',
          text_length: text.length
        },
        is_active: true
      });

      if (insertProfileErr) {
        logger.error('Insert resume_profiles error:', insertProfileErr);
        // on ne renvoie pas 500 si l’analyse a marché et que le resume est créé,
        // mais on loggue pour pouvoir corriger.
      }

      // ✅ Réponse finale (même forme qu’avant pour le front)
      return res.json({
        message: 'CV uploaded successfully',
        url: publicUrl,
        filename: originalname,
        size
      });
    } catch (error) {
      logger.error('CV upload error:', error);
      return res.status(500).json({
        error: 'Failed to upload CV',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

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
    const { error: deleteError } = await supabase.storage.from('resumes').remove([filePath]);
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
    res.status(500).json({ error: 'Failed to delete CV' });
  }
});

export default router;
