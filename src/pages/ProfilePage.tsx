import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import { 
  User, 
  Upload, 
  FileText, 
  Save, 
  Loader2, 
  Download,
  Trash2,
  Eye,
  Settings
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = 'pdf';
      const fileName = `${user?.id}-cv.${fileExt}`;
      const filePath = `cvs/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath);

      // Update user profile with CV URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ cv_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('CV uploaded successfully!');
    } catch (error) {
      console.error('Error uploading CV:', error);
      toast.error('Failed to upload CV');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCV = async () => {
    if (!profile?.cv_url) return;

    setLoading(true);

    try {
      // Extract file path from URL
      const url = new URL(profile.cv_url);
      const filePath = url.pathname.split('/').slice(-2).join('/');

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('user-files')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ cv_url: null })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('CV deleted successfully');
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast.error('Failed to delete CV');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCV = () => {
    if (profile?.cv_url) {
      window.open(profile.cv_url, '_blank');
    }
  };

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
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                    profile?.is_premium 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile?.is_premium ? (
                      <>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Premium</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
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
                  <span>CV Management</span>
                </h2>
              </div>
              <div className="p-6">
                {profile?.cv_url ? (
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-green-900 mb-2">
                        CV Uploaded Successfully
                      </h3>
                      <p className="text-green-700 mb-6">
                        Your CV is ready to be used in interview preparations
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={handleViewCV}
                          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View CV</span>
                        </button>
                        
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          <span>{uploading ? 'Uploading...' : 'Replace CV'}</span>
                        </button>
                        
                        <button
                          onClick={handleDeleteCV}
                          disabled={loading}
                          className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span>Delete CV</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Upload Your CV
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Upload your CV to get personalized AI assistance during interview preparation
                      </p>
                      
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
                      
                      <p className="text-xs text-gray-500 mt-4">
                        PDF files only, max 5MB
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
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
                  <span className="font-medium">
                    {profile?.is_premium ? 'Premium' : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Booster</span>
                  <span className="font-medium">
                    {profile?.is_premium 
                      ? 'Unlimited' 
                      : profile?.booster_used 
                        ? 'Used' 
                        : 'Available'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CV Status</span>
                  <span className="font-medium">
                    {profile?.cv_url ? 'Uploaded' : 'Not uploaded'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pro Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Keep your CV updated for better AI assistance</li>
                <li>• Use a clear, well-formatted PDF for best results</li>
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