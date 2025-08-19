import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/ui/Toast';
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

const PreparationJourney: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEditedRef = React.useRef<{ step: number; data: any } | null>(null);

  const steps = [
    { number: 1, title: 'Job Analysis', component: Step1JobAnalysis },
    { number: 2, title: 'Business Model', component: Step2BusinessModel },
    { number: 3, title: 'Company Strategy', component: Step3SWOT },
    { number: 4, title: 'Your Profile', component: Step4Profile },
    { number: 5, title: 'Why Questions', component: Step5WhyQuestions },
    { number: 6, title: 'Interview Questions', component: Step6Questions },
    { number: 7, title: 'Generate Report', component: Step7GenerateReport },
  ];

  useEffect(() => {
    if (!user) return;

    // Create mode
    if (!id || id === 'new') {
      setPreparation({
        id: '', // not yet in DB
        title: '',
        job_url: '',
        is_complete: false,
        step_1_data: {},
        step_2_data: {},
        step_3_data: {},
        step_4_data: {},
        step_5_data: {},
        step_6_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    // Edit mode
    fetchPreparation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // Best-effort flush on tab hide / page unload
  useEffect(() => {
    const onBeforeUnload = () => {
      // pas d'attente possible ici
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSave(); // tente un flush
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPreparation = async () => {
    try {
      const { data, error } = await supabase
        .from('preparations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (error) {
        if ((error as any).code === 'PGRST116') {
          toast.error('Preparation not found');
          navigate('/dashboard');
          return;
        }
        throw error;
      }

      setPreparation(data as Preparation);
    } catch (error) {
      console.error('Error fetching preparation:', error);
      toast.error('Failed to load preparation');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Crée l'enregistrement si besoin et renvoie l'id
  const ensurePreparationId = async (): Promise<string | undefined> => {
    if (!preparation) return;
    if (preparation.id) return preparation.id;

    const derived = buildTitleFromStep1(preparation.step_1_data);
    const safeTitle =
      (preparation.title && preparation.title.trim()) ||
      derived ||
      'Interview Preparation';

    try {
      const payload = {
        title: safeTitle,
        job_url: preparation.job_url ?? '',
        is_complete: false,
        user_id: user!.id,
        step_1_data: preparation.step_1_data ?? {},
        step_2_data: preparation.step_2_data ?? {},
        step_3_data: preparation.step_3_data ?? {},
        step_4_data: preparation.step_4_data ?? {},
        step_5_data: preparation.step_5_data ?? {},
        step_6_data: preparation.step_6_data ?? {},
      };

      const { data, error } = await supabase
        .from('preparations')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;

      setPreparation(prev => (prev ? { ...prev, id: (data as any).id } : prev));
      return (data as any).id;
    } catch (e) {
      console.error('Error ensuring preparation id:', e);
      toast.error('Failed to create preparation');
    }
  };

  const persistStepToSupabase = async (stepNumber: number, data: any) => {
    if (!preparation) return;
    setSaving(true);
    try {
      const prepId = preparation.id || (await ensurePreparationId());
      if (!prepId) return;

      const stepKey = `step_${stepNumber}_data`;

      // si on sauvegarde l'étape 1, mettre à jour la colonne title
      const extra: Record<string, any> = {};
      if (stepNumber === 1) {
        const derived = buildTitleFromStep1(data);
        if (derived) {
          extra.title = derived;
        }
      }


      const { error } = await supabase
        .from('preparations')
        .update({
          [stepKey]: data,
          updated_at: new Date().toISOString(),
          ...extra,
        })
        .eq('id', prepId)
        .eq('user_id', user!.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating step data:', err);
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const updateStepData = (stepNumber: number, data: any) => {
    // 1) mise à jour locale immédiate
    const stepKey = `step_${stepNumber}_data` as keyof Preparation;
    setPreparation(prev => {
      if (!prev) return prev as any;

      const next: Preparation = {
        ...prev,
        [stepKey]: data,
        updated_at: new Date().toISOString(),
      } as Preparation;

      if (stepNumber === 1) {
        const derived = buildTitleFromStep1(data);
        if (derived && derived !== prev.title) {
          next.title = derived;
        }
      }

      return next;
    });

    // 2) mémorise la dernière édition
    lastEditedRef.current = { step: stepNumber, data };

    // 3) sauvegarde debouncée
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      if (lastEditedRef.current) {
        const { step, data } = lastEditedRef.current;
        persistStepToSupabase(step, data);
        lastEditedRef.current = null;
      }
      saveTimerRef.current = null;
    }, 1000);
  };

  const flushPendingSave = async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (lastEditedRef.current) {
      const { step, data } = lastEditedRef.current;
      lastEditedRef.current = null;
      await persistStepToSupabase(step, data);
    }
  };

  const nextStep = async () => {
    await flushPendingSave();
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const prevStep = async () => {
    await flushPendingSave();
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const goToStep = async (stepNumber: number) => {
    await flushPendingSave();
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
  const currentStepData = (preparation as any)[`step_${currentStep}_data`] || {};

  const buildTitleFromStep1 = (step1: any) => {
    const jt = step1?.job_title?.trim();
    const cn = step1?.company_name?.trim();
    return jt && cn ? `${jt} at ${cn}` : '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={async () => {
                  await flushPendingSave();
                  navigate('/dashboard');
                }}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back to Dashboard
              </button>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              {buildTitleFromStep1(preparation.step_1_data) || preparation.title || 'Untitled Preparation'}
            </h1>
            <div className="flex items-center space-x-2">
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
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    currentStep === step.number
                      ? 'bg-indigo-600 text-white'
                      : currentStep > step.number
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </button>
                <span
                  className={`ml-2 text-sm font-medium ${
                    currentStep === step.number ? 'text-indigo-600' : 'text-gray-600'
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`ml-4 w-8 h-0.5 ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {currentStep === 7 ? (
            <Step7GenerateReport
              data={currentStepData}
              onUpdate={(data: any) => updateStepData(currentStep, data)}
              preparation={preparation}
            />
          ) : (
          <CurrentStepComponent
            data={currentStepData}
            onUpdate={(data: any) => updateStepData(currentStep, data)}
            cvData={(preparation as any).step_4_data}
            jobData={(preparation as any).step_1_data}
            swotData={(preparation as any).step_3_data}
            matchingResults={(preparation as any).step_4_data?.matchingResults}
            companyName={(preparation as any).step_1_data?.company_name}
          />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            <button
              onClick={nextStep}
              disabled={currentStep === steps.length}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreparationJourney;
