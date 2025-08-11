import express from 'express';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
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

      const authUid = req.user!.id;                   // Supabase Auth user id (JWT sub)
      const file = req.file;

      // 1) Build storage path
      const path = `cvs/${authUid}/${uuidv4()}-${file.originalname}`;

      // 2) Upload to Storage with Service Role
      const { error: uploadError } = await supabase
        .storage
        .from('resumes')
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

      if (uploadError) {
        logger.error('File upload error:', uploadError);
        return res.status(400).json({ error: uploadError.message || 'Storage upload failed' });
      }

      // 3) Ensure app-level user exists in public.users (auth_user_id -> id)
      //    (If you already have public.ensure_user(), you could call it via a user-bound client;
      //     here we inline it with Service Role for simplicity.)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUid)
        .single();

      let appUserId = existingUser?.id;
      if (!appUserId) {
        const { data: authUserRow, error: authErr } = await supabase
          .from('user_profiles')               // lightweight way to get email if you mirror it here
          .select('id')
          .eq('id', authUid)
          .single();

        // If you prefer email, fetch from auth schema via RPC or store it on sign-up.
        const { data: inserted, error: insertUserErr } = await supabase
          .from('users')
          .insert({
            id: crypto.randomUUID(),           // or use gen_random_uuid() in DB; either is fine
            auth_user_id: authUid,
            email: null                        // optional if you don't have email here
          })
          .select('id')
          .single();

        if (insertUserErr || !inserted) {
          logger.error('Failed to ensure public.users row:', insertUserErr);
          return res.status(400).json({ error: 'Failed to ensure app user' });
        }
        appUserId = inserted.id;
      }

      // 4) Insert resume metadata with Service Role (RLS bypass)
      const { data: resumeRow, error: resumeErr } = await supabase
        .from('resumes')
        .insert({
          user_id: appUserId,                 // <-- public.users.id (NOT auth uid)
          storage_path: path,
          original_filename: file.originalname,
          mime_type: file.mimetype,
          status: 'uploaded'
        })
        .select('id, storage_path')
        .single();

      if (resumeErr || !resumeRow) {
        logger.error('Resume DB insert error:', resumeErr);
        return res.status(400).json({ error: resumeErr?.message || 'Failed to create resume record' });
      }

      // 5) (Optional) Public URL if bucket is public. If private, return path & sign URL later.
      const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(path);

      return res.status(200).json({
        message: 'CV uploaded successfully',
        resumeId: resumeRow.id,
        storagePath: resumeRow.storage_path,
        publicUrl: publicUrl || null
      });
    } catch (error: any) {
      logger.error('CV upload error:', error);
      return res.status(500).json({ error: error.message || 'Upload failed' });
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