import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { aiService } from '@/lib/aiService';
import { TwoColumnList } from '@/components/common';
import { useArrayField } from '@/components/hooks';

interface Step1Props {
  data: {
    company_name?: string;
    job_title?: string;
    keyRequirements?: string[];
    keyResponsibilities?: string[];
    company_summary?: string;
  };
  onUpdate: (data: any) => void;
}

export default function Step1JobAnalysis({ data, onUpdate }: Step1Props) {
  const [mode, setMode] = useState<'url' | 'text'>('text'); // url masqué mais conservé
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Hooks factorisés pour gérer les tableaux
  const reqField = useArrayField(data.keyRequirements || [], (next) =>
    onUpdate({ ...data, keyRequirements: next })
  );
  const respField = useArrayField(data.keyResponsibilities || [], (next) =>
    onUpdate({ ...data, keyResponsibilities: next })
  );

  const handleAnalyzeJob = async () => {
    if (mode === 'url' && !jobUrl.trim()) {
      setError('Please enter a job URL');
      return;
    }
    if (mode === 'text' && !jobText.trim()) {
      setError('Please enter job description text');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const analysisResult =
        mode === 'url'
          ? await aiService.analyzeJobFromUrl(jobUrl.trim())
          : await aiService.analyzeJobFromText(jobText.trim());

      onUpdate({
        ...data,
        company_name: analysisResult.company_name || '',
        job_title: analysisResult.job_title || '',
        keyRequirements: analysisResult.required_profile || [],
        keyResponsibilities: analysisResult.responsibilities || [],
        company_summary: analysisResult.company_summary || data.company_summary || '',
        title: `${analysisResult.job_title || ''} at ${analysisResult.company_name || ''}`,
      });
    } catch (err) {
      console.error('Job analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Analyze Job Description</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMode('text')}
            className={`px-3 py-1.5 rounded-md text-sm border ${mode === 'text' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-300 text-gray-700'}`}
          >
            Text
          </button>
          {/* Mode URL conservé mais masqué par défaut */}
          {false && (
            <button
              onClick={() => setMode('url')}
              className={`px-3 py-1.5 rounded-md text-sm border ${mode === 'url' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              URL
            </button>
          )}
          <button
            onClick={handleAnalyzeJob}
            disabled={isAnalyzing}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isAnalyzing ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing…</>) : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Input area */}
      {mode === 'text' && (
        <div className="space-y-4">
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste the full job description here…"
            className="w-full min-h-[160px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      )}
      {mode === 'url' && false && (
        <div className="space-y-4">
          <input
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      )}

      {/* Company fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Company</label>
          <input
            value={data.company_name || ''}
            onChange={(e) => onUpdate({ ...data, company_name: e.target.value })}
            placeholder="Enter company name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Job Title</label>
          <input
            value={data.job_title || ''}
            onChange={(e) => onUpdate({ ...data, job_title: e.target.value })}
            placeholder="Enter job title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Company summary */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Company summary</label>
        <textarea
          value={data.company_summary || ''}
          onChange={(e) => onUpdate({ ...data, company_summary: e.target.value })}
          placeholder="Short neutral summary of the company (auto-filled after analysis)"
          className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Two columns: Requirements / Responsibilities */}
      <TwoColumnList
        left={{
          title: 'Key Requirements',
          items: data.keyRequirements || [],
          onAdd: reqField.add,
          onUpdate: reqField.update,
          onRemove: reqField.remove,
          placeholder: 'Add a requirement…',
        }}
        right={{
          title: 'Key Responsibilities',
          items: data.keyResponsibilities || [],
          onAdd: respField.add,
          onUpdate: respField.update,
          onRemove: respField.remove,
          placeholder: 'Add a responsibility…',
        }}
      />
    </div>
  );
}
