import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
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
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

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
        fetchPreparation();
      } else {
        createNewPreparation();
      }
    }
  }, [id, user]);

  const createNewPreparation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('preparations')
        .insert([{
          user_id: user.id,
          title: 'New Interview Preparation',
          job_url: '',
          step_1_data: {},
          step_2_data: {},
          step_3_data: {},
          step_4_data: {},
          step_5_data: {},
          step_6_data: {}
        }])
        .select()
        .single();

      if (error) throw error;
      
      setPreparation(data);
      navigate(`/preparation/${data.id}`, { replace: true });
    } catch (error) {
      console.error('Error creating preparation:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

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

  const updatePreparation = async (stepData: any, stepNumber: number) => {
    if (!preparation) return;

    try {
      const updateData = {
        [`step_${stepNumber}_data`]: stepData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('preparations')
        .update(updateData)
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
        .update({ title, updated_at: new Date().toISOString() })
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Dashboard
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {preparation.title}
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <button
                  onClick={() => goToStep(step.number)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
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
                </button>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === step.number ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <CurrentStepComponent
            data={preparation[`step_${currentStep}_data` as keyof Preparation]}
            onUpdate={(data: any) => updatePreparation(data, currentStep)}
            jobUrl={preparation.job_url}
            preparationTitle={preparation.title}
            onTitleUpdate={updatePreparationTitle}
            allStepData={{
              step_1_data: preparation.step_1_data,
              step_2_data: preparation.step_2_data,
              step_3_data: preparation.step_3_data,
              step_4_data: preparation.step_4_data,
              step_5_data: preparation.step_5_data,
              step_6_data: preparation.step_6_data
            }}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-4 py-2 rounded-md ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <button
            onClick={nextStep}
            disabled={currentStep === steps.length}
            className={`flex items-center px-4 py-2 rounded-md ${
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