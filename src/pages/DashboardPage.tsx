import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  FileText, 
  Clock, 
  Crown, 
  Zap, 
  Upload,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface Preparation {
  id: string;
  title: string;
  job_url: string;
  created_at: string;
  updated_at: string;
  is_complete: boolean;
  step_1_data?: any;
  step_2_data?: any;
  step_3_data?: any;
  step_4_data?: any;
  step_5_data?: any;
  step_6_data?: any;
}

export default function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [preparations, setPreparations] = useState<Preparation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPreparations: 0,
    completedPreparations: 0,
    averageCompletionTime: 0
  });

  useEffect(() => {
    fetchPreparations();
  }, []);

  const fetchPreparations = async () => {
    try {
      if (!user) {
        console.error('User not authenticated');
        return;
      }
      
      console.log('Fetching preparations for user:', user.id);
      
      const { data, error } = await supabase
        .from('preparations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch preparations: ${error.message}`);
      }
      
      if (data === null) {
        console.error('Data is null - this might indicate a permissions issue');
        throw new Error('No data returned from Supabase');
      }
      
      console.log('Fetched preparations:', data);

      setPreparations(data);
      
      // Calculate stats
      const total = data.length;
      const completed = data.filter(p => p.is_complete).length;
      
      setStats({
        totalPreparations: total,
        completedPreparations: completed,
        averageCompletionTime: total > 0 ? Math.round((completed / total) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching preparations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepCompletion = (prep: Preparation) => {
    const steps = [
      prep.step_1_data,
      prep.step_2_data,
      prep.step_3_data,
      prep.step_4_data,
      prep.step_5_data,
      prep.step_6_data
    ];
    const completed = steps.filter(step => step && Object.keys(step).length > 0).length;
    return { completed, total: 6 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back!
          </h1>
          <p className="text-gray-600 mt-2">
            Track your interview preparations and boost your success rate
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Preparations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPreparations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedPreparations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageCompletionTime}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    to="/preparation"
                    className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                  >
                    <Plus className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-semibold text-gray-900">New Preparation</p>
                      <p className="text-sm text-gray-600">Start your journey</p>
                    </div>
                  </Link>
                  
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                  >
                    <Upload className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-semibold text-gray-900">Upload CV</p>
                      <p className="text-sm text-gray-600">Update your resume</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Preparations List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Your Preparations</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {preparations.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No preparations yet</h3>
                    <p className="text-gray-600 mb-4">Start your first interview preparation journey</p>
                    <Link
                      to="/preparation"
                      className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Preparation</span>
                    </Link>
                  </div>
                ) : (
                  preparations.map((prep) => {
                    const { completed, total } = getStepCompletion(prep);
                    const progressPercent = (completed / total) * 100;
                    
                    return (
                      <div key={prep.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {prep.title || 'Untitled Preparation'}
                            </h3>
                            {prep.job_url && (
                              <p className="text-sm text-gray-600 mb-2 truncate">
                                {prep.job_url}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(prep.updated_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {prep.is_complete ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-green-600">Complete</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    <span className="text-yellow-600">In Progress</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{completed}/{total} steps</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${progressPercent}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          
                          <Link
                            to={`/preparation/${prep.id}`}
                            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                          >
                            Continue
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              
              {profile?.is_premium ? (
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Premium Active</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg mb-3">
                    <span className="font-medium text-gray-800">Free Plan</span>
                  </div>
                  <Link
                    to="/premium"
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white px-4 py-2 rounded-md font-medium transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <Crown className="h-4 w-4" />
                    <span>Upgrade to Premium</span>
                  </Link>
                </div>
              )}
            </div>

            {/* AI Booster Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Booster</h3>
              
              {profile?.is_premium ? (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Unlimited Boosts</span>
                </div>
              ) : (
                <div>
                  {profile?.booster_used ? (
                    <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
                      <Zap className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">Booster Used</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                      <Zap className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">1 Boost Available</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pro Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Upload your latest CV for better AI assistance</li>
                <li>• Complete all 6 steps for maximum preparation</li>
                <li>• Use the AI booster on complex job descriptions</li>
                <li>• Review your preparation report before interviews</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}