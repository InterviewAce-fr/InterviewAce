import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { aiService } from '@/lib/aiService';
import { TwoColumnList } from '@/components/common';
import { useArrayField } from '@/components/hooks';

interface Step1Props {
  data: {
    company_name?: string;
    company_summary?: string; // NEW
    job_title?: string;
    keyRequirements?: string[];
    keyResponsibilities?: string[];
  };
  onUpdate: (data: any) => void;
}

function extractCompanySummaryFallback(raw: string): string | undefined {
  if (!raw) return undefined;
  const m = raw.match(/(?:about\s+(?:us|the company)|à\s+propos(?:\s+de\s+l'?entreprise)?)\s*[:\-]?\s*([\s\S]{80,500})/i);
  const s = m?.[1]?.split(/\n{2,}/)?.[0]?.trim();
  return s || undefined;
}

export default function Step1JobAnalysis({ data, onUpdate }: Step1Props) {
  const [mode, setMode] = useState<'url' | 'text'>('text'); // url masqué mais conservé
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Pré‑remplissage éventuel à partir de data
  useEffect(() => {
    // si tu veux hydrater jobText/jobUrl depuis data, fais‑le ici
  }, [data]);

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

      // Fallback si le backend ne renvoie pas company_summary
      const fallbackSummary = analysisResult.company_summary || extractCompanySummaryFallback(jobText);

      onUpdate({
        ...data,
        company_name: analysisResult.company_name || '',
        company_summary: fallbackSummary || '',
        job_title: analysisResult.job_title || '',
        keyRequirements: analysisResult.required_profile || [],
        keyResponsibilities: analysisResult.responsibilities || [],
        title: `${analysisResult.job_title || ''} at ${analysisResult.company_name || ''}`,
      });
    } catch (err) {
      console.error('Job analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Hooks factorisés pour gérer les tableaux
  const reqField = useArrayField(data.keyRequirements || [], (next) =>
    onUpdate({ ...data, keyRequirements: next })
  );
  const respField = useArrayField(data.keyResponsibilities || [], (next) =>
    onUpdate({ ...data, keyResponsibilities: next })
  );

  return (
    <div className="space-y-6">
      {/* Bloc analyse de l'offre */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Analysis</h2>

        {/* Sélecteur de mode masqué mais conservé dans le code (met à true si tu veux l’afficher) */}
        {false && (
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setMode('url')}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                mode === 'url'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              URL
            </button>
            <button
              onClick={() => setMode('text')}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                mode === 'text'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Text
            </button>
          </div>
        )}

        {/* Zone d’entrée (on garde le mode texte visible) */}
        {mode === 'url' && false ? (
          <div className="space-y-4">{/* …ton bloc URL d’origine si besoin… */}</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Copy and paste the complete job description from the job posting (LinkedIn, company website, etc.)
              </p>
              <div className="space-y-3">
                <textarea
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder="Paste the complete job description here including company name, job title, requirements, responsibilities, etc..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAnalyzeJob}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Détails du poste */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={data.company_name || ''}
              onChange={(e) => onUpdate({ ...data, company_name: e.target.value })}
              placeholder="Enter company name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
            <input
              type="text"
              value={data.job_title || ''}
              onChange={(e) => onUpdate({ ...data, job_title: e.target.value })}
              placeholder="Enter job title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* (Optionnel) résumé société visible et éditable */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Summary</label>
          <textarea
            value={data.company_summary || ''}
            onChange={(e) => onUpdate({ ...data, company_summary: e.target.value })}
            placeholder="Short company blurb (mission, product, market, scale…) if available"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Deux colonnes : Requirements / Responsibilities */}
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
    </div>
  );
}
