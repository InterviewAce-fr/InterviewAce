import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { aiService } from '@/lib/aiService';
import { supabase } from '@/lib/supabase';

type ProfilePageProps = {
  refreshProfile?: () => Promise<void> | void;
};

const STORAGE_BUCKET = 'resumes';

const ProfilePage: React.FC<ProfilePageProps> = ({ refreshProfile }) => {
  const [uploading, setUploading] = useState(false);

  // Backend base (set VITE_API_BASE_URL in your .env)
  const apiBase =
    (import.meta as any).env?.VITE_API_BASE_URL ??
    (window as any).VITE_API_BASE_URL ??
    'http://localhost:3001';

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    // Validate type & size (keep your existing UI/validation)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
  
    setUploading(true);
    try {
      // Auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const accessToken = session.access_token;
      const uid = session.user.id;
  
      // Build form and call backend (Service Role does Storage + DB insert)
      const form = new FormData();
      form.append('cv', file);
  
      const apiBase =
        (import.meta as any).env?.VITE_API_BASE_URL ??
        (window as any).VITE_API_BASE_URL ??
        'http://localhost:3001';
  
      const resp = await fetch(`${apiBase}/upload/cv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      if (!resp.ok) {
        const msg = await resp.text().catch(() => '');
        throw new Error(msg || 'Backend upload failed');
      }
      const { resumeId, storagePath } = await resp.json();
  
      // Simple text for MVP extraction (unchanged)
      const resumeText = `Resume: ${file.name}\nFile Type: ${file.type}\nSize: ${file.size} bytes`;
  
      // AI extraction (unchanged logic)
      const extractedData = await aiService.analyzeCVFromText(resumeText);
  
      // Ensure app-level user exists → get public.users.id
      const { data: userId, error: euErr } = await supabase.rpc('ensure_user');
      if (euErr || !userId) throw new Error(`Failed to ensure user exists: ${euErr?.message || 'no id returned'}`);
  
      // Create resume profile (same as before)
      const { error: profileError } = await supabase.from('resume_profiles').insert({
        resume_id: resumeId,
        user_id: userId,
        language: extractedData?.language ?? 'en',
        person: extractedData?.person || {},
        education: extractedData?.education || [],
        experience: extractedData?.experience || [],
        skills: extractedData?.skills || [],
        raw_data: { originalText: resumeText },
        is_active: true,
      });
      if (profileError) console.error('Resume profile creation error:', profileError);
  
      // Update lightweight user profile keyed by auth uid (unchanged)
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ cv_url: storagePath, updated_at: new Date().toISOString() })
        .eq('id', uid);
      if (updateError) console.error('Profile update error:', updateError);
  
      if (typeof refreshProfile === 'function') {
        try { await refreshProfile(); } catch {}
      }
      toast.success('CV uploaded successfully!');
    } catch (err: any) {
      console.error('Error uploading CV:', err);
      toast.error(err?.message || 'Failed to upload CV');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Upload your CV</h2>

      <input
        type="file"
        accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        onChange={handleCVUpload}
        disabled={uploading}
        className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-100 hover:file:bg-gray-200"
      />

      {uploading && (
        <p className="text-sm text-gray-500 mt-2">Uploading & analyzing…</p>
      )}
    </div>
  );
};

export default ProfilePage;
