import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Step1JobAnalysis } from '../components/preparation/Step1JobAnalysis';
import { Step2BusinessModel } from '../components/preparation/Step2BusinessModel';
import { Step3SWOT } from '../components/preparation/Step3SWOT';
import { Step4Profile } from '../components/preparation/Step4Profile';
import { Step5WhyQuestions } from '../components/preparation/Step5WhyQuestions';
import { Step6Questions } from '../components/preparation/Step6Questions';
import { ChevronLeft, ChevronRight, Save, FileText } from 'lucide-react';

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

const STEPS = [
  { id: 1, title: 'Job Analysis', component: Step1JobAnalysis },
  { id: 2, title: 'Business Model', component: Step2BusinessModel },
  { id: 3, title: 'SWOT Analysis', component: Step3SWOT },
  { id: 4, title: 'Profile Match', component: Step4Profile },
  { id: 5, title: 'Why Questions', component: Step5WhyQuestions },
  { id: 6, title: 'Interview Questions', component: Step6Questions },
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
    if (!user) {
      navigate('/login');
      return;
    }

    if (id) {
      fetchPreparation();
    } else {
      createNewPreparation();
    }
  }, [id, user, navigate]);

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

  const createNewPreparation = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('preparations')
        .insert([{
          user_id: user!.id,
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
      setError('Failed to create preparation');
    } finally {
      setLoading(false);
    }
  };

  const savePreparation = async (stepData: any, stepNumber: number) => {
    if (!preparation) return;

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
        .eq('user_id', user!.id);

      if (error) throw error;

      setPreparation(prev => prev ? {
        ...prev,
        [stepKey]: stepData,
        updated_at: new Date().toISOString()
      } : null);
    } catch (error) {
      console.error('Error saving preparation:', error);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const updateTitle = async (newTitle: string) => {
    if (!preparation) return;

    try {
      const { error } = await supabase
        .from('preparations')
        .update({
          title: newTitle.trim() || 'New Interview Preparation',
          updated_at: new Date().toISOString()
        })
        .eq('id', preparation.id)
        .eq('user_id', user!.id);

      if (error) throw error;

      setPreparation(prev => prev ? {
        ...prev,
        title: newTitle.trim() || 'New Interview Preparation',
        updated_at: new Date().toISOString()
      } : null);
    } catch (error) {
      console.error('Error updating title:', error);
      setError('Failed to update title');
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
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

  if (error || !preparation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Preparation not found'}
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-gray-600 mr-4"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <input
                type="text"
                value={preparation.title}
                onChange={(e) => updateTitle(e.target.value)}
                className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
                placeholder="Preparation Title"
              />
            </div>
            <div className="flex items-center space-x-4">
              {saving && (
                <div className="flex items-center text-sm text-gray-500">
                  <Save className="h-4 w-4 mr-1 animate-pulse" />
                  Saving...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex space-x-8">
              {STEPS.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentStep === step.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    currentStep === step.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.id}
                  </span>
                  <span>{step.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CurrentStepComponent
          data={preparation[`step_${currentStep}_data` as keyof Preparation]}
          onSave={(data: any) => savePreparation(data, currentStep)}
          preparation={preparation}
        />

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
              currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>

          <button
            onClick={nextStep}
            disabled={currentStep === STEPS.length}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
              currentStep === STEPS.length
                ? 'text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}