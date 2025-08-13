import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import {
  User,
  Upload,
  FileText,
  Loader2,
  Trash2,
  Settings,
} from 'lucide-react';

// ——— Logs env (utile en prod) ———
console.log('=== SUPABASE CONFIG CHECK ===');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log(
  'VITE_SUPABASE_ANON_KEY:',
  anonKey ? `${anonKey.slice(0, 8)}...${anonKey.slice(-8)}` : 'NOT SET'
);
console.log('================================');

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return toast.error('Please upload a PDF, DOC, DOCX, or TXT file');
    }
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File size must be less than 10MB');
    }

    setUploading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL; // doit inclure /api
      if (!API_BASE) throw new Error('VITE_API_BASE_URL manquante');

      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('cv', file);

      const res = await fetch(`${API_BASE}/upload/cv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);

      await refreshProfile();
      toast.success('CV uploaded successfully!');
    } catch (e) {
      console.error('Error uploading CV:', e);
      toast.error('Failed to upload CV');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCV = async () => {
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL; // idem, pas de fallback
      if (!API_BASE) throw new Error('VITE_API_BASE_URL manquante');

      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_BASE}/upload/cv`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Delete failed: ${res.status} ${await res.text()}`);

      await refreshProfile();
      toast.success('CV deleted successfully');
    } catch (e) {
      console.error('Error deleting CV:', e);
      toast.error('Failed to delete CV');
    } finally {
      setLoading(false);
    }
  };

  const hasCV = !!profile?.cv_url;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <span>Profile Settings</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your account information and upload your CV
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Account Information</span>
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Status
                  </label>
                  <div
                    className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                      profile?.is_premium
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {profile?.is_premium ? (
                      <>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        <span>Premium</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span>Free</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member Since
                  </label>
                  <p className="text-gray-900">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* CV Management */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Resume Management</span>
                </h2>
              </div>
              <div className="p-6">
                {hasCV ? (
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-green-900 mb-2">CV Uploaded</h3>
                      <p className="text-green-700 mb-6">
                        Your CV has been uploaded and is ready for use in interview preparations.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                          href={profile?.cv_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          <span>View CV</span>
                        </a>

                        <button
                          onClick={handleDeleteCV}
                          disabled={loading}
                          className="inline-flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          <span>{loading ? 'Deleting...' : 'Delete CV'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your CV</h3>
                      <p className="text-gray-600 mb-6">
                        Upload your CV to get personalized AI assistance during interview preparation
                      </p>

                      <div className="space-y-4">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors disabled:opacity-50 mx-auto"
                        >
                          {uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Upload className="h-5 w-5" />
                          )}
                          <span>{uploading ? 'Uploading...' : 'Choose File'}</span>
                        </button>

                        <p className="text-xs text-gray-500">PDF, DOC, DOCX, or TXT files only, max 10MB</p>
                      </div>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleCVUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Type</span>
                  <span className="font-medium">{profile?.is_premium ? 'Premium' : 'Free'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Booster</span>
                  <span className="font-medium">
                    {profile?.is_premium ? 'Unlimited' : profile?.booster_used ? 'Used' : 'Available'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Resumes</span>
                  <span className="font-medium">{hasCV ? 'Uploaded' : 'None'}</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pro Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Upload your most current CV for best results</li>
                <li>• AI will automatically extract your profile data</li>
                <li>• Your CV data will be used in interview preparations</li>
                <li>• Premium users get unlimited AI boosts</li>
                <li>• Your CV is securely stored and encrypted</li>
              </ul>
            </div>

            {/* Support */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Having trouble with your account or need assistance?
              </p>
              <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
