import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ArrowRight, CheckCircle, Circle } from 'lucide-react';
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

const PreparationJourney: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const steps = [
    { number: 1, title: 'Job Analysis', component: Step1JobAnalysis },
    { number: 2, title: 'Business Model', component: Step2BusinessModel },
    { number: 3, title: 'SWOT Analysis', component: Step3SWOT },
    { number: 4, title: 'Your Experience', component: Step4Profile },
    { number: 5, title: 'Why Questions', component: Step5WhyQuestions },
    { number: 6, title: 'Interview Questions', component: Step6Questions },
    { number: 7, title: 'Generate Report', component: Step7GenerateReport }
  ];

  useEffect(() => {
    if (!user || !id) return;
    loadPreparation();
  }, [user, id]);

  const loadPreparation = async () => {
    try {
      const { data, error } = await supabase
        .from('preparations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error loading preparation:', error);
        navigate('/dashboard');
        return;
      }

      setPreparation(data);
    } catch (error) {
      console.error('Error loading preparation:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updatePreparation = async (stepData: any, stepNumber?: number) => {
    if (!preparation || !user) return;

    setSaving(true);
    try {
      const stepKey = stepNumber ? `step_${stepNumber}_data` : `step_${currentStep}_data`;
      const updatedData = {
        ...preparation,
        [stepKey]: stepData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('preparations')
        .update(updatedData)
        .eq('id', preparation.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPreparation(data);
    } catch (error) {
      console.error('Error updating preparation:', error);
    } finally {
      setSaving(false);
    }
  };

  const isStepComplete = (stepNumber: number) => {
    if (!preparation) return false;
    const stepData = preparation[`step_${stepNumber}_data` as keyof Preparation];
    return stepData && Object.keys(stepData).length > 0;
  };

  const canProceedToNext = () => {
    return isStepComplete(currentStep);
  };

  const nextStep = () => {
    if (currentStep < steps.length && canProceedToNext()) {
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

  if (!preparation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Preparation not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900">{preparation.title}</h1>
              <p className="text-sm text-gray-500">Step {currentStep} of {steps.length}</p>
            </div>
            <div className="flex items-center">
              {saving && (
                <div className="flex items-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                  Saving...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <button
                  onClick={() => goToStep(step.number)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                    currentStep === step.number
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : isStepComplete(step.number)
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-500'
                  }`}
                >
                  {isStepComplete(step.number) && currentStep !== step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </button>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === step.number ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <CurrentStepComponent
            data={preparation[`step_${currentStep}_data` as keyof Preparation] || {}}
            allStepsData={{
              step1: preparation.step_1_data || {},
              step2: preparation.step_2_data || {},
              step3: preparation.step_3_data || {},
              step4: preparation.step_4_data || {},
              step5: preparation.step_5_data || {},
              step6: preparation.step_6_data || {}
            }}
            onUpdate={(data: any) => updatePreparation(data)}
            preparation={preparation}
            profile={profile}
            preparationTitle={preparation.title}
          />
        </div>

        {/* Navigation */}
        {currentStep < 7 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Previous
            </button>

            <button
              onClick={nextStep}
              disabled={!canProceedToNext()}
              className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                canProceedToNext()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreparationJourney;