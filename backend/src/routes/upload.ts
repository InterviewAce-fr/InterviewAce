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
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-files')
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
        .from('user-files')
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

      res.json({
        message: 'CV uploaded successfully',
        url: publicUrl,
        filename: req.file.originalname,
        size: req.file.size
      });

    } catch (error) {
      logger.error('CV upload error:', error);
      console.log('Supabase error details:', error);
      res.status(500).json({ 
        error: 'Failed to upload CV',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
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
    const { error: deleteError } = await supabase.storage
      .from('user-files')
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