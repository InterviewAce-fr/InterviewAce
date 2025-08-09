import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
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
  job_url: string;
  is_complete: boolean;
  step_1_data: any;
  step_2_data: any;
  step_3_data: any;
  step_4_data: any;
  step_5_data: any;
  step_6_data: any;
  created_at: string;
  updated_at: string;
}

const steps = [
  { number: 1, title: 'Job Analysis', component: Step1JobAnalysis },
  { number: 2, title: 'Business Model', component: Step2BusinessModel },
  { number: 3, title: 'Company Strategy', component: Step3SWOT },
  { number: 4, title: 'Your Experience', component: Step4Profile },
  { number: 5, title: 'Why Questions', component: Step5WhyQuestions },
  { number: 6, title: 'Interview Questions', component: Step6Questions },
  { number: 7, title: 'Generate Report', component: Step7GenerateReport }
];

export default function PreparationJourney() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && user) {
      loadPreparation();
    }
  }, [id, user]);

  const loadPreparation = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('preparations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setPreparation(data);
    } catch (err) {
      console.error('Error loading preparation:', err);
      setError('Failed to load preparation');
    } finally {
      setLoading(false);
    }
  };

  const savePreparation = async (stepData: any, stepNumber: number) => {
    if (!preparation || !user) return;

    try {
      setSaving(true);
      const stepKey = `step_${stepNumber}_data`;
      
      const { error } = await supabase
        .from('preparations')
        .update({
          [stepKey]: stepData,
          updated_at: new Date().toISOString()
        })
        .eq('id', preparation.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPreparation(prev => prev ? {
        ...prev,
        [stepKey]: stepData,
        updated_at: new Date().toISOString()
      } : null);
    } catch (err) {
      console.error('Error saving preparation:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleStepChange = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!preparation || !user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('preparations')
        .update({
          is_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', preparation.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPreparation(prev => prev ? {
        ...prev,
        is_complete: true,
        updated_at: new Date().toISOString()
      } : null);
    } catch (err) {
      console.error('Error completing preparation:', err);
      setError('Failed to mark as complete');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
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
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep - 1].component;
  const stepDataKey = `step_${currentStep}_data`;
  const currentStepData = preparation[stepDataKey as keyof Preparation] || {};

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
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Dashboard
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {preparation.is_complete && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete
                </div>
              )}
              {saving && (
                <div className="flex items-center text-indigo-600">
                  <Save className="w-5 h-5 mr-2 animate-pulse" />
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{preparation.title}</h1>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div
                  className={`flex items-center cursor-pointer ${
                    currentStep === step.number
                      ? 'text-indigo-600'
                      : currentStep > step.number
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                  onClick={() => handleStepChange(step.number)}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === step.number
                        ? 'bg-indigo-600 text-white'
                        : currentStep > step.number
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium hidden sm:block">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 rounded ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <CurrentStepComponent
            data={currentStepData}
            onSave={(data: any) => savePreparation(data, currentStep)}
            preparation={preparation}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`flex items-center px-4 py-2 rounded-lg ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          <div className="flex items-center space-x-4">
            {currentStep === steps.length && !preparation.is_complete && (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Mark as Complete
              </button>
            )}
            
            {currentStep < steps.length && (
              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}