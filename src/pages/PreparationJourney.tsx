import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import Step1JobAnalysis from '../components/preparation/Step1JobAnalysis';
import Step2BusinessModel from '../components/preparation/Step2BusinessModel';
import Step3SWOT from '../components/preparation/Step3SWOT';
import Step4Profile from '../components/preparation/Step4Profile';
import Step5WhyQuestions from '../components/preparation/Step5WhyQuestions';
import Step6Questions from '../components/preparation/Step6Questions';

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
}

const PreparationJourney: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { number: 1, title: 'Job Analysis', component: Step1JobAnalysis },
    { number: 2, title: 'Business Model', component: Step2BusinessModel },
    { number: 3, title: 'SWOT Analysis', component: Step3SWOT },
    { number: 4, title: 'Profile Match', component: Step4Profile },
    { number: 5, title: 'Why Questions', component: Step5WhyQuestions },
    { number: 6, title: 'Interview Questions', component: Step6Questions }
  ];

  useEffect(() => {
    if (user) {
      if (id) {
        loadPreparation();
      } else {
        createNewPreparation();
      }
    }
  }, [id, user]);

  const createNewPreparation = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().toLocaleString();
      const { data, error } = await supabase
        .from('preparations')
        .insert([{
          title: `Interview Preparation - ${timestamp}`,
          job_url: '',
          user_id: user?.id,
          step_1_data: {},
          step_2_data: {},
          step_3_data: {},
          step_4_data: {},
          step_5_data: {},
          step_6_data: {}
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating preparation:', error);
        throw error;
      }

      console.log('Created new preparation:', data);
      setPreparation(data);
      navigate(`/preparation/${data.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to create preparation:', error);
      setError('Failed to create new preparation');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (error) {
      console.error('Error loading preparation:', error);
      setError('Failed to load preparation');
    } finally {
      setLoading(false);
    }
  };

  const updatePreparation = async (stepData: any, stepNumber: number) => {
    if (!preparation) return;

    try {
      const stepKey = `step_${stepNumber}_data`;
      const { data, error } = await supabase
        .from('preparations')
        .update({ [stepKey]: stepData })
        .eq('id', preparation.id)
        .select()
        .single();

      if (error) throw error;

      setPreparation(data);
    } catch (error) {
      console.error('Error updating preparation:', error);
    }
  };

  const updatePreparationTitle = async (title: string) => {
    if (!preparation) return;

    try {
      const { data, error } = await supabase
        .from('preparations')
        .update({ title })
        .eq('id', preparation.id)
        .select()
        .single();

      if (error) throw error;

      setPreparation(data);
    } catch (error) {
      console.error('Error updating preparation title:', error);
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

  const goToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
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
            <h1 className="text-xl font-semibold text-gray-900 truncate max-w-md">
              {preparation.title}
            </h1>
            <div className="flex items-center space-x-2">
              {preparation.is_complete && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-1" />
                  <span className="text-sm">Complete</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
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
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-4">
            {steps.map((step) => (
              <button
                key={step.number}
                onClick={() => goToStep(step.number)}
                className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentStep === step.number
                    ? 'bg-indigo-100 text-indigo-700'
                    : currentStep > step.number
                    ? 'text-green-600 hover:text-green-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                    currentStep === step.number
                      ? 'bg-indigo-600 text-white'
                      : currentStep > step.number
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {currentStep > step.number ? '✓' : step.number}
                </span>
                <span>{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <CurrentStepComponent
              data={preparation[`step_${currentStep}_data` as keyof Preparation]}
              onUpdate={(data: any) => updatePreparation(data, currentStep)}
              jobUrl={preparation.job_url}
              preparationTitle={preparation.title}
              onTitleUpdate={updatePreparationTitle}
              allStepsData={{
                step1: preparation.step_1_data,
                step2: preparation.step_2_data,
                step3: preparation.step_3_data,
                step4: preparation.step_4_data,
                step5: preparation.step_5_data,
                step6: preparation.step_6_data
              }}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 rounded-b-lg">
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

            <span className="text-sm text-gray-500">
              {steps[currentStep - 1].title}
            </span>

            <button
              onClick={nextStep}
              disabled={currentStep === steps.length}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                currentStep === steps.length
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreparationJourney;