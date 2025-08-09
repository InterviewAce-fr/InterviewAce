import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Import step components
import Step1JobAnalysis from '../components/preparation/Step1JobAnalysis';
import Step2BusinessModel from '../components/preparation/Step2BusinessModel';
import Step3SWOT from '../components/preparation/Step3SWOT';
import Step4Profile from '../components/preparation/Step4Profile';
import Step5WhyQuestions from '../components/preparation/Step5WhyQuestions';
import Step6Questions from '../components/preparation/Step6Questions';
import Step7GenerateReport from '../components/preparation/Step7GenerateReport';

interface PreparationData {
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
}

const PreparationJourney: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [preparation, setPreparation] = useState<PreparationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const steps = [
    { number: 1, title: 'Job Analysis', component: Step1JobAnalysis },
    { number: 2, title: 'Business Model', component: Step2BusinessModel },
    { number: 3, title: 'Company Strategy', component: Step3SWOT },
    { number: 4, title: 'Your Experience', component: Step4Profile },
    { number: 5, title: 'Why Questions', component: Step5WhyQuestions },
    { number: 6, title: 'Interview Questions', component: Step6Questions },
    { number: 7, title: 'Generate Report', component: Step7GenerateReport }
  ];

  useEffect(() => {
    if (id && user) {
      loadPreparation();
    }
  }, [id, user]);

  const loadPreparation = async () => {
    try {
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
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const savePreparation = async (stepData: any, step: number) => {
    if (!preparation || saving) return;

    setSaving(true);
    try {
      const stepKey = `step_${step}_data`;
      const updatedData = {
        ...preparation,
        [stepKey]: stepData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('preparations')
        .update(updatedData)
        .eq('id', preparation.id);

      if (error) throw error;

      setPreparation(updatedData);
    } catch (error) {
      console.error('Error saving preparation:', error);
    } finally {
      setSaving(false);
    }
  };

  const markComplete = async () => {
    if (!preparation) return;

    try {
      const { error } = await supabase
        .from('preparations')
        .update({ is_complete: true })
        .eq('id', preparation.id);

      if (error) throw error;

      setPreparation({ ...preparation, is_complete: true });
    } catch (error) {
      console.error('Error marking complete:', error);
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
        </div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep - 1].component;
  const currentStepData = preparation[`step_${currentStep}_data` as keyof PreparationData];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{preparation.title}</h1>
            {preparation.is_complete && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Complete</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.number === currentStep
                        ? 'bg-indigo-600 text-white'
                        : step.number < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              {steps.map((step) => (
                <span key={step.number} className="text-center">
                  {step.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <CurrentStepComponent
            data={currentStepData}
            onUpdate={(data: any) => savePreparation(data, currentStep)}
            preparation={preparation}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-6 py-3 rounded-lg font-medium ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          {currentStep === steps.length ? (
            <button
              onClick={markComplete}
              disabled={preparation.is_complete}
              className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                preparation.is_complete
                  ? 'bg-green-100 text-green-600 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {preparation.is_complete ? 'Completed' : 'Mark Complete'}
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreparationJourney;