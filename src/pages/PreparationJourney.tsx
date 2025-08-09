import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

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

const steps = [
  { number: 1, title: 'Job Analysis', component: Step1JobAnalysis },
  { number: 2, title: 'Business Model', component: Step2BusinessModel },
  { number: 3, title: 'SWOT Analysis', component: Step3SWOT },
  { number: 4, title: 'Company Profile', component: Step4Profile },
  { number: 5, title: 'Why Questions', component: Step5WhyQuestions },
  { number: 6, title: 'Interview Questions', component: Step6Questions },
  { number: 7, title: 'Generate Report', component: Step7GenerateReport },
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
    if (!preparation) return;

    try {
      setSaving(true);
      const stepField = `step_${step}_data`;
      
      const { error } = await supabase
        .from('preparations')
        .update({
          [stepField]: data,
          updated_at: new Date().toISOString()
        })
        .eq('id', preparation.id)
        .eq('user_id', user!.id);

      if (error) throw error;

      setPreparation(prev => prev ? {
        ...prev,
        [stepField]: data,
        updated_at: new Date().toISOString()
      } : null);
    } catch (error) {
      console.error('Error saving step data:', error);
      setError('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
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
      setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Loading preparation...</p>
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
            className="text-indigo-600 hover:text-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              {preparation.title}
            </h1>
            <div className="flex items-center space-x-4">
              {saving && (
                <div className="flex items-center text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto py-4">
            {steps.map((step) => (
              <button
                key={step.number}
                onClick={() => setCurrentStep(step.number)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                  currentStep === step.number
                    ? 'bg-indigo-100 text-indigo-700'
                    : currentStep > step.number
                    ? 'text-green-600 hover:text-green-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-xs">
                    {step.number}
                  </span>
                )}
                <span>{step.title}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <CurrentStepComponent
              data={preparation[`step_${currentStep}_data` as keyof Preparation] || {}}
              onUpdate={(data: any) => saveStepData(currentStep, data)}
              {...(currentStep === 7 && {
                allStepsData: {
                  step1: preparation.step_1_data || {},
                  step2: preparation.step_2_data || {},
                  step3: preparation.step_3_data || {},
                  step4: preparation.step_4_data || {},
                  step5: preparation.step_5_data || {},
                  step6: preparation.step_6_data || {},
                },
                preparationTitle: preparation.title
              })}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="flex space-x-3">
              {currentStep === steps.length ? (
                <button
                  onClick={markComplete}
                  disabled={saving}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Complete Journey
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}