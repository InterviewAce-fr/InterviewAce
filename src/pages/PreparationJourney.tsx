import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/ui/Toast';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Zap,
  HelpCircle,
  CheckCircle,
  FileText,
  Download
} from 'lucide-react';

import Step1JobAnalysis from '../components/preparation/Step1JobAnalysis';
import Step2BusinessModel from '../components/preparation/Step2BusinessModel';
import Step3SWOT from '../components/preparation/Step3SWOT';
import Step4Profile from '../components/preparation/Step4Profile';
import Step5WhyQuestions from '../components/preparation/Step5WhyQuestions';
import Step6Questions from '../components/preparation/Step6Questions';

interface PreparationData {
  id?: string;
  title: string;
  job_url: string;
  step_1_data: any;
  step_2_data: any;
  step_3_data: any;
  step_4_data: any;
  step_5_data: any;
  step_6_data: any;
  is_complete: boolean;
}

const STEPS = [
  { id: 1, title: 'Job Analysis', description: 'Analyze the job posting and requirements' },
  { id: 2, title: 'Business Model', description: 'Understand the company\'s business canvas' },
  { id: 3, title: 'SWOT Analysis', description: 'Evaluate strengths, weaknesses, opportunities, threats' },
  { id: 4, title: 'Profile & Experience', description: 'Match your profile to the role' },
  { id: 5, title: 'Why Questions', description: 'Prepare compelling answers' },
  { id: 6, title: 'Interview Questions', description: 'Practice common interview questions' }
];

export default function PreparationJourney() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preparationData, setPreparationData] = useState<PreparationData>({
    title: '',
    job_url: '',
    step_1_data: {},
    step_2_data: {},
    step_3_data: {},
    step_4_data: {},
    step_5_data: {},
    step_6_data: {},
    is_complete: false
  });

  useEffect(() => {
    if (id) {
      fetchPreparation();
    }
  }, [id]);

  const fetchPreparation = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('preparations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();
      
      if (error) {
        console.error('Supabase fetch error:', error);
        toast.error('Failed to load preparation');
        navigate('/dashboard');
        return;
      }
      
      if (data) {
        setPreparationData(data);
      }
    } catch (error) {
      console.error('Error fetching preparation:', error);
      toast.error('Failed to load preparation');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const savePreparation = async (data?: Partial<PreparationData>) => {
    setSaving(true);
    
    try {
      const dataToSave = data || preparationData;
      
      if (id) {
        // Update existing preparation
        const { error } = await supabase
          .from('preparations')
          .update(dataToSave)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        // Create new preparation via backend API
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session?.access_token) {
          throw new Error('Not authenticated');
        }
        
        const response = await fetch(`${backendUrl}/api/preparations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`
          },
          body: JSON.stringify(dataToSave)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Backend response error:', errorData);
          
          // Handle specific error codes
          if (errorData.code === 'PREPARATION_LIMIT_REACHED') {
            throw new Error('You have reached the free plan limit of 1 preparation. Please upgrade to Premium to create more preparations.');
          } else {
            throw new Error(errorData.message || 'Failed to create preparation');
          }
        }
        
        const newPrep = await response.json();
        
        if (newPrep) {
          navigate(`/preparation/${newPrep.id}`, { replace: true });
          setPreparationData(prev => ({ ...prev, id: newPrep.id }));
        console.error('Supabase insert error:', error);
        }
      }
      
      toast.success('Progress saved successfully');
    } catch (error) {
      console.error('Error saving preparation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const updateStepData = (stepNumber: number, data: any) => {
    const stepKey = `step_${stepNumber}_data` as keyof PreparationData;
    const updatedData = {
      ...preparationData,
      [stepKey]: data
    };
    setPreparationData(updatedData);
    
    // Auto-save after a delay
    setTimeout(() => {
      savePreparation(updatedData);
    }, 1000);
  };

  const canUseBooster = () => {
    return profile?.is_premium || !profile?.booster_used;
  };

  const useAIBooster = async () => {
    if (!canUseBooster()) {
      toast.error('AI Booster not available');
      return;
    }

    try {
      // This would call your edge function for AI assistance
      toast.info('AI Booster feature coming soon!');
    } catch (error) {
      toast.error('Failed to use AI Booster');
    }
  };

  const generateReport = async () => {
    // Check if all steps are completed
    const allStepsCompleted = STEPS.every(step => {
      const stepData = preparationData[`step_${step.id}_data` as keyof PreparationData];
      return stepData && Object.keys(stepData).length > 0;
    });

    if (!allStepsCompleted) {
      toast.error('Please complete all steps before generating the report');
      return;
    }

    try {
      // Mark as complete and save
      const completeData = { ...preparationData, is_complete: true };
      await savePreparation(completeData);
      
      // This would generate and download the PDF report
      toast.success('Report generated successfully!');
      
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const renderCurrentStep = () => {
    const props = {
      data: preparationData[`step_${currentStep}_data` as keyof PreparationData] || {},
      onUpdate: (data: any) => updateStepData(currentStep, data),
      jobUrl: preparationData.job_url,
      preparationTitle: preparationData.title
    };

    switch (currentStep) {
      case 1:
        return <Step1JobAnalysis {...props} onTitleUpdate={(title) => 
          setPreparationData(prev => ({ ...prev, title }))} />;
      case 2:
        return <Step2BusinessModel {...props} />;
      case 3:
        return <Step3SWOT {...props} />;
      case 4:
        return <Step4Profile {...props} />;
      case 5:
        return <Step5WhyQuestions {...props} />;
      case 6:
        return <Step6Questions {...props} />;
      default:
        return null;
    }
  };

  const getStepCompletion = (stepNumber: number) => {
    const stepData = preparationData[`step_${stepNumber}_data` as keyof PreparationData];
    return stepData && Object.keys(stepData).length > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {preparationData.title || 'New Preparation'}
              </h1>
              <div className="flex items-center space-x-3">
                {canUseBooster() && (
                  <button
                    onClick={useAIBooster}
                    className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-md font-medium transition-all transform hover:scale-105"
                  >
                    <Zap className="h-4 w-4" />
                    <span>AI Booster</span>
                  </button>
                )}
                
                <button
                  onClick={() => savePreparation()}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
            
            {/* Step indicators */}
            <div className="flex items-center space-x-4 overflow-x-auto pb-2">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                    currentStep === step.id
                      ? 'bg-blue-100 text-blue-800'
                      : getStepCompletion(step.id)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : getStepCompletion(step.id)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-400 text-white'
                  }`}>
                    {getStepCompletion(step.id) ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className="font-medium">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Step {currentStep}: {STEPS[currentStep - 1].title}
                </h2>
                <p className="text-gray-600 mt-1">
                  {STEPS[currentStep - 1].description}
                </p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50">
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {renderCurrentStep()}
          </div>
          
          {/* Navigation */}
          <div className="px-6 py-4 border-t flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            <div className="flex items-center space-x-3">
              {currentStep === STEPS.length && (
                <button
                  onClick={generateReport}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Generate Report</span>
                </button>
              )}
              
              <button
                onClick={() => setCurrentStep(Math.min(STEPS.length, currentStep + 1))}
                disabled={currentStep === STEPS.length}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}