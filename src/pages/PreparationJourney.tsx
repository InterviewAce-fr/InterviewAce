import React, { useState } from 'react';
import Step1JobAnalysis from '@/components/preparation/Step1JobAnalysis';
import Step2CompanyIntel from '@/components/preparation/Step2CompanyIntel';
import Step3SWOT from '@/components/preparation/Step3SWOT';
import Step7GenerateReport from '@/components/preparation/Step7GenerateReport';

export default function PreparationJourney() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any>({});
  const onUpdate = (next: any) => setData(next);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Stepper current={step} setCurrent={setStep} />

      {step === 1 && <Step1JobAnalysis data={data} onUpdate={onUpdate} />}
      {step === 2 && <Step2CompanyIntel data={data} onUpdate={onUpdate} />}
      {step === 3 && <Step3SWOT data={data} onUpdate={onUpdate} />}
      {step === 7 && <Step7GenerateReport data={data} onUpdate={onUpdate} />}

      <div className="mt-8 flex items-center gap-2">
        <button
          className="px-3 py-1.5 rounded-md border"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          Prev
        </button>
        <button
          className="px-3 py-1.5 rounded-md border"
          onClick={() => setStep((s) => Math.min(7, s + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Stepper({ current, setCurrent }: { current: number; setCurrent: (n: number) => void }) {
  const steps = [
    'Job Analysis',
    'Company Intelligence', // NEW
    'Business Model / SWOT',
    '…',
    '…',
    '…',
    'Final Report',
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        return (
          <button
            key={n}
            onClick={() => setCurrent(n)}
            className={`px-3 py-1.5 rounded-full text-sm border ${active ? 'bg-black text-white' : 'bg-white'}`}
          >
            {n}. {label}
          </button>
        );
      })}
    </div>
  );
}
