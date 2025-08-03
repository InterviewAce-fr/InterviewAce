import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import Step1JobAnalysis from '../components/preparation/Step1JobAnalysis';
import Step2BusinessModel from '../components/preparation/Step2BusinessModel';
import Step3SWOT from '../components/preparation/Step3SWOT';
import Step4Profile from '../components/preparation/Step4Profile';
import Step5WhyQuestions from '../components/preparation/Step5WhyQuestions';
import Step6Questions from '../components/preparation/Step6Questions';

interface Preparation {
  id: string;
  user_id: string;
  title: string;
  job_url: string;
  created_at: string;
  updated_at: string;
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
  const [saving, setSaving] = useState(false);

  const steps = [
    { number: 1, title: 'Job Analysis', component: Step1JobAnalysis },
    { number: 2, title: 'Business Model', component: Step2BusinessModel },
    { number: 3, title: 'SWOT Analysis', component: Step3SWOT },
    { number: 4, title: 'Company Profile', component: Step4Profile },
    { number: 5, title: 'Why Questions', component: Step5WhyQuestions },
    { number: 6, title: 'Interview Questions', component: Step6Questions },
  ];

  useEffect(() => {
    if (id && user) {
      fetchPreparation();
    }
  }, [id, user]);

  const fetchPreparation = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('preparations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setPreparation(data);
    } catch (error) {
      console.error('Error fetching preparation:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updatePreparationTitle = async (title: string) => {
    if (!preparation) return;

    try {
      const { data, error } = await supabase
        .from('preparations')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', preparation.id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      setPreparation(data);
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const updateStepData = async (stepNumber: number, data: any) => {
    if (!preparation) return;

    setSaving(true);
    try {
      const stepKey = `step_${stepNumber}_data`;
      const { data: updatedData, error } = await supabase
        .from('preparations')
        .update({ 
          [stepKey]: data,
          updated_at: new Date().toISOString()
        })
        .eq('id', preparation.id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      setPreparation(updatedData);
    } catch (error) {
      console.error('Error updating step data:', error);
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
  const currentStepData = preparation[`step_${currentStep}_data` as keyof Preparation];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Dashboard
            </button>
            {saving && (
              <div className="flex items-center text-indigo-600">
                <Save className="w-4 h-4 mr-2 animate-pulse" />
                Saving...
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {preparation.title || 'Interview Preparation'}
          </h1>
          
          {/* Progress Bar */}
          <div className="flex items-center space-x-2 mb-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step.number
                      ? 'bg-indigo-600 text-white'
                      : currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <p className="text-gray-600">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
          </p>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <CurrentStepComponent
            data={currentStepData}
            onUpdate={(data: any) => updateStepData(currentStep, data)}
            jobUrl={preparation.job_url}
            preparationTitle={preparation.title}
            onTitleUpdate={updatePreparationTitle}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-4 py-2 rounded-lg ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>
          
          <button
            onClick={nextStep}
            disabled={currentStep === steps.length}
            className={`flex items-center px-4 py-2 rounded-lg ${
              currentStep === steps.length
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreparationJourney;