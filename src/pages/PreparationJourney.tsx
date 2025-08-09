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
import Step7GenerateReport from '../components/preparation/Step7GenerateReport';

interface Preparation {
  id: string;
  title: string;
  job_url: string;
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
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const steps = [
    { number: 1, title: 'Job Analysis', component: Step1JobAnalysis },
    { number: 2, title: 'Business Model', component: Step2BusinessModel },
    { number: 3, title: 'SWOT Analysis', component: Step3SWOT },
    { number: 4, title: 'Company Profile', component: Step4Profile },
    { number: 5, title: 'Why Questions', component: Step5WhyQuestions },
    { number: 6, title: 'Interview Questions', component: Step6Questions },
    { number: 7, title: 'Generate Report', component: Step7GenerateReport }
  ];

  useEffect(() => {
    if (id) {
      loadPreparation();
    } else {
      createNewPreparation();
    }
  }, [id]);

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

  const createNewPreparation = async () => {
    try {
      const newPreparation = {
        title: `Interview Preparation - ${new Date().toLocaleDateString()}`,
        job_url: '',
        step_1_data: {},
        step_2_data: {},
        step_3_data: {},
        step_4_data: {},
        step_5_data: {},
        step_6_data: {},
        user_id: user?.id
      };

      const { data, error } = await supabase
        .from('preparations')
        .insert([newPreparation])
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

  const updatePreparation = async (stepData: any, stepNumber: number) => {
    if (!preparation) return;

    setSaving(true);
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
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {preparation.title}
            </h1>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4 overflow-x-auto">
            {steps.map((step, index) => (
              <button
                key={step.number}
                onClick={() => goToStep(step.number)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  currentStep === step.number
                    ? 'bg-indigo-100 text-indigo-700'
                    : currentStep > step.number
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-current opacity-20 flex items-center justify-center text-xs font-bold">
                    {step.number}
                  </span>
                )}
                <span className="text-sm font-medium">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <CurrentStepComponent
            data={preparation[`step_${currentStep}_data` as keyof Preparation] || {}}
            onUpdate={(data: any) => updatePreparation(data, currentStep)}
            preparation={preparation}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="text-sm text-gray-500">
              {saving && 'Saving...'}
            </div>

            <button
              onClick={nextStep}
              disabled={currentStep === steps.length}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                currentStep === steps.length
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {currentStep === steps.length - 1 ? 'Complete Journey' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreparationJourney;