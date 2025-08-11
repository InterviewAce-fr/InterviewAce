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

    // Validate file type
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

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      // Check auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      const uid = session.user.id;
      const accessToken = session.access_token;

      console.log('=== CV Upload Starting ===');
      console.log('User ID:', uid);
      console.log('File:', { name: file.name, type: file.type, size: file.size });

      // Build multipart form
      const form = new FormData();
      form.append('cv', file);

      // Send to backend: this route does Storage upload + DB insert into public.resumes with Service Role
      const resp = await fetch(`${apiBase}/upload/cv`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      });

      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(`Backend upload failed: ${msg}`);
      }

      const { resumeId, storagePath, publicUrl } = await resp.json();
      console.log('Backend upload OK:', { resumeId, storagePath, publicUrl });

      // At this point, the file is uploaded and the `resumes` row exists (server-side insert bypassed RLS).
      // Continue with AI extraction and creating a resume_profile.

      // Prepare a simple text payload for MVP extraction (replace with real parsing later)
      const resumeText = `Resume: ${file.name}\nFile Type: ${file.type}\nSize: ${file.size} bytes`;

      // Call AI service to extract structured data
      const extractedData = await aiService.analyzeCVFromText(resumeText);

      // Ensure we still have a session (defensive)
      const sessionNow = (await supabase.auth.getSession()).data.session;
      if (!sessionNow) throw new Error('Not authenticated (session expired)');

      // We need the app user id (public.users.id) to write resume_profiles.
      // Prefer calling your ensure_user RPC (it inserts if missing and returns public.users.id).
      const { data: userId, error: euErr } = await supabase.rpc('ensure_user');
      if (euErr || !userId) {
        console.error('ensure_user error:', euErr);
        // Not fatal to the upload; but we need it to write resume_profiles correctly.
        throw new Error(`Failed to ensure user exists: ${euErr?.message || 'no id returned'}`);
      }

      console.log('AUTH UID =', uid);
      console.log('APP userId =', userId);

      // Create resume profile with extracted data
      const { error: profileError } = await supabase
        .from('resume_profiles')
        .insert({
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

      if (profileError) {
        console.error('Resume profile creation error:', profileError);
        // Don't throw here; upload + resumes row already succeeded
      }

      // Optionally update a lightweight user profile table keyed by auth uid
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          cv_url: storagePath, // store storage path (sign later if private)
          updated_at: new Date().toISOString(),
        })
        .eq('id', uid); // assuming user_profiles.id = auth.users.id

      if (updateError) {
        console.error('Profile update error:', updateError);
        // Non-blocking
      }

      // Refresh UI
      if (typeof refreshProfile === 'function') {
        try { await refreshProfile(); } catch { /* noop */ }
      }

      toast.success('CV uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading CV:', error);
      toast.error(error?.message || 'Failed to upload CV');
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
