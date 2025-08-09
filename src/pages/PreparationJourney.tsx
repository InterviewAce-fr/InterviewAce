import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

// Import step components
import Step1JobAnalysis from '../components/preparation/Step1JobAnalysis';
import Step2BusinessModel from '../components/preparation/Step2BusinessModel';
import Step3SWOT from '../components/preparation/Step3SWOT';
import Step4Profile from '../components/preparation/Step4Profile';
import Step5WhyQuestions from '../components/preparation/Step5WhyQuestions';
import Step6Questions from '../components/preparation/Step6Questions';
import Step7GenerateReport from '../components/preparation/Step7GenerateReport';

interface Preparation {
  id: string;
  title: string;
  job_url?: string;
  step_1_data: any;
  step_2_data: any;
  step_3_data: any;
  step_4_data: any;
  step_5_data: any;
  step_6_data: any;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

const stepComponents = [
  Step1JobAnalysis,
  Step2BusinessModel,
  Step3SWOT,
  Step4Profile,
  Step5WhyQuestions,
  Step6Questions,
  Step7GenerateReport
];

const stepTitles = [
  'Job Analysis',
  'Business Model',
  'SWOT Analysis',
  'Company Profile',
  'Why Questions',
  'Interview Questions',
  'Generate Report'
];

export default function PreparationJourney() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    fetchPreparation();
  }, [user, id]);

  const fetchPreparation = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('preparations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setPreparation(data);
    } catch (error) {
      console.error('Error fetching preparation:', error);
      setError('Failed to load preparation');
    } finally {
      setLoading(false);
    }
  };

  const saveStepData = async (step: number, data: any) => {
    if (!preparation || step === 7) return; // Don't save step 7 data

    try {
      setSaving(true);
      const { error } = await supabase
        .from('preparations')
        .update({
          [`step_${step}_data`]: data,
          updated_at: new Date().toISOString()
        })
        .eq('id', preparation.id)
        .eq('user_id', user!.id);

      if (error) throw error;

      setPreparation(prev => prev ? {
        ...prev,
        [`step_${step}_data`]: data
      } : null);
    } catch (error) {
      console.error('Error saving step data:', error);
      setError('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const markComplete = async () => {
    if (!preparation) return;

    try {
      const { error } = await supabase
        .from('preparations')
        .update({
          is_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', preparation.id)
        .eq('user_id', user!.id);

      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      console.error('Error marking complete:', error);
      setError('Failed to complete preparation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preparation...</p>
        </div>
      </div>
    );
  }

  if (error || !preparation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Preparation not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = stepComponents[currentStep - 1];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{preparation.title}</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-2 mb-4">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index + 1 === currentStep
                      ? 'bg-indigo-600 text-white'
                      : index + 1 < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1 < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < stepTitles.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <h2 className="text-lg font-semibold text-gray-800">
            Step {currentStep}: {stepTitles[currentStep - 1]}
          </h2>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <CurrentStepComponent
              data={preparation[`step_${currentStep}_data` as keyof Preparation] || {}}
              onUpdate={currentStep === 7 ? () => {} : (data: any) => saveStepData(currentStep, data)}
              {...(currentStep === 7 && {
                allStepsData: {
                  step1: preparation.step_1_data || {},
                  step2: preparation.step_2_data || {},
                  step3: preparation.step_3_data || {},
                  step4: preparation.step_4_data || {},
                  step5: preparation.step_5_data || {},
                  step6: preparation.step_6_data || {}
                },
                preparationTitle: preparation.title,
                onComplete: markComplete
              })}
            />
          </div>

          {/* Navigation */}
          {currentStep < 7 && (
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center px-4 py-2 rounded-md ${
                  currentStep === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </button>

              <button
                onClick={nextStep}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}