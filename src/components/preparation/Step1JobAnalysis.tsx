import React, { useState, useEffect } from 'react';
import { Link, Globe, FileText, Loader2, Plus, X, Edit3 } from 'lucide-react';
import { aiService } from '../../lib/aiService';

interface Step1Props {
  data: {
    company_name?: string;
    job_title?: string;
    keyRequirements?: string[];
    keyResponsibilities?: string[];
  };
  onUpdate: (data: any) => void;
}

export default function Step1JobAnalysis({ data, onUpdate }: Step1Props) {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Initialize with existing data
  useEffect(() => {
    if (data.company_name || data.job_title) {
      // Pre-populate fields if data exists
    }
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
      let analysisResult;
      
      if (mode === 'url') {
        analysisResult = await aiService.analyzeJobFromUrl(jobUrl.trim());
      } else {
        analysisResult = await aiService.analyzeJobFromText(jobText.trim());
      }

      // Update the step data with AI analysis results
      onUpdate({
        ...data,
        company_name: analysisResult.company_name || '',
        job_title: analysisResult.job_title || '',
        keyRequirements: analysisResult.required_profile || [],
        keyResponsibilities: analysisResult.responsibilities || []
      });

    } catch (err) {
      console.error('Job analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addRequirement = () => {
    const requirements = (data.keyRequirements || []);
    onUpdate({
      ...data,
      keyRequirements: [...requirements, '']
    });
  };

  const updateRequirement = (index: number, value: string) => {
    const requirements = (data.keyRequirements || []);
    const updated = [...requirements];
    updated[index] = value;
    onUpdate({
      ...data,
      keyRequirements: updated
    });
  };

  const removeRequirement = (index: number) => {
    const requirements = (data.keyRequirements || []);
    const updated = requirements.filter((_, i) => i !== index);
    onUpdate({
      ...data,
      keyRequirements: updated
    });
  };

  const addResponsibility = () => {
    const responsibilities = (data.keyResponsibilities || []);
    onUpdate({
      ...data,
      keyResponsibilities: [...responsibilities, '']
    });
  };

  const updateResponsibility = (index: number, value: string) => {
    const responsibilities = (data.keyResponsibilities || []);
    const updated = [...responsibilities];
    updated[index] = value;
    onUpdate({
      ...data,
      keyResponsibilities: updated
    });
  };

  const removeResponsibility = (index: number) => {
    const responsibilities = (data.keyResponsibilities || []);
    const updated = responsibilities.filter((_, i) => i !== index);
    onUpdate({
      ...data,
      keyResponsibilities: updated
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Analysis</h2>
        
        {/* Mode Selection */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setMode('url')}
            className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
              mode === 'url'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Link className="w-4 h-4 mr-2" />
            Job URL
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
              mode === 'text'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Job Text
          </button>
        </div>

        {/* Input Section */}
        {mode === 'url' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Posting URL
              </label>
              <div className="flex space-x-3">
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://company.com/jobs/position"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAnalyzeJob}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Globe className="w-4 h-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze URL'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description Text
              </label>
              <div className="space-y-3">
                <textarea
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder="Paste the complete job description here..."
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

      {/* Job Details Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={data.company_name || ''}
              onChange={(e) => onUpdate({ ...data, company_name: e.target.value })}
              placeholder="Enter company name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={data.job_title || ''}
              onChange={(e) => onUpdate({ ...data, job_title: e.target.value })}
              placeholder="Enter job title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Key Requirements */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Key Requirements
            </label>
            <button
              onClick={addRequirement}
              className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {(data.keyRequirements || []).length === 0 ? (
              <p className="text-gray-500 text-sm italic">No requirements added yet</p>
            ) : (
              (data.keyRequirements || []).map((requirement, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    placeholder="Enter requirement"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeRequirement(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Key Responsibilities */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Key Responsibilities
            </label>
            <button
              onClick={addResponsibility}
              className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {(data.keyResponsibilities || []).length === 0 ? (
              <p className="text-gray-500 text-sm italic">No responsibilities added yet</p>
            ) : (
              (data.keyResponsibilities || []).map((responsibility, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={responsibility}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    placeholder="Enter responsibility"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeResponsibility(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}