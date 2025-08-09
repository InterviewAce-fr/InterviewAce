import React, { useState, useEffect } from 'react';
import { Link, ExternalLink, Briefcase, Building, Users, Target, Loader2 } from 'lucide-react';
import { aiService } from '../../lib/aiService';

interface Step1Data {
  jobTitle?: string;
  company?: string;
  jobUrl?: string;
  jobDescription?: string;
  keyRequirements?: string[];
  keyResponsibilities?: string[];
  companySize?: string;
  industry?: string;
  location?: string;
  salaryRange?: string;
}

interface Step1JobAnalysisProps {
  data: Step1Data;
  onUpdate: (data: Step1Data) => void;
}

export default function Step1JobAnalysis({ data, onUpdate }: Step1JobAnalysisProps) {
  const [analysisMode, setAnalysisMode] = useState<'url' | 'text'>('url');
  const [jobUrl, setJobUrl] = useState(data.jobUrl || '');
  const [jobText, setJobText] = useState(data.jobDescription || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeJob = async () => {
    if (!jobUrl.trim() && !jobText.trim()) {
      setError('Please provide either a job URL or job description text');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let analysisResult;
      
      if (analysisMode === 'url' && jobUrl.trim()) {
        analysisResult = await aiService.analyzeJobFromUrl(jobUrl.trim());
      } else if (analysisMode === 'text' && jobText.trim()) {
        analysisResult = await aiService.analyzeJobFromText(jobText.trim());
      }

      if (analysisResult) {
        const updatedData = {
          ...data,
          jobTitle: analysisResult.jobTitle || data.jobTitle,
          company: analysisResult.company || data.company,
          jobUrl: analysisMode === 'url' ? jobUrl : data.jobUrl,
          jobDescription: analysisMode === 'text' ? jobText : analysisResult.jobDescription || data.jobDescription,
          keyRequirements: analysisResult.keyRequirements || data.keyRequirements || [],
          keyResponsibilities: analysisResult.keyResponsibilities || data.keyResponsibilities || [],
          companySize: analysisResult.companySize || data.companySize,
          industry: analysisResult.industry || data.industry,
          location: analysisResult.location || data.location,
          salaryRange: analysisResult.salaryRange || data.salaryRange
        };
        onUpdate(updatedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze job');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addRequirement = () => {
    const requirements = data.keyRequirements || [];
    onUpdate({
      ...data,
      keyRequirements: [...requirements, '']
    });
  };

  const updateRequirement = (index: number, value: string) => {
    const requirements = data.keyRequirements || [];
    const updated = [...requirements];
    updated[index] = value;
    onUpdate({
      ...data,
      keyRequirements: updated
    });
  };

  const removeRequirement = (index: number) => {
    const requirements = data.keyRequirements || [];
    onUpdate({
      ...data,
      keyRequirements: requirements.filter((_, i) => i !== index)
    });
  };

  const addResponsibility = () => {
    const responsibilities = data.keyResponsibilities || [];
    onUpdate({
      ...data,
      keyResponsibilities: [...responsibilities, '']
    });
  };

  const updateResponsibility = (index: number, value: string) => {
    const responsibilities = data.keyResponsibilities || [];
    const updated = [...responsibilities];
    updated[index] = value;
    onUpdate({
      ...data,
      keyResponsibilities: updated
    });
  };

  const removeResponsibility = (index: number) => {
    const responsibilities = data.keyResponsibilities || [];
    onUpdate({
      ...data,
      keyResponsibilities: responsibilities.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Briefcase className="w-8 h-8 text-indigo-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Job Analysis</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Let's start by analyzing the job you're preparing for. You can either provide a job URL for automatic analysis or paste the job description directly.
        </p>
      </div>

      {/* Analysis Mode Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setAnalysisMode('url')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              analysisMode === 'url'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Link className="w-4 h-4 inline mr-2" />
            Job URL
          </button>
          <button
            onClick={() => setAnalysisMode('text')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              analysisMode === 'text'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Job Text
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {analysisMode === 'url' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Posting URL
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://company.com/careers/job-posting"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleAnalyzeJob}
                disabled={isAnalyzing || !jobUrl.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Analyze
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description Text
            </label>
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the complete job description here..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleAnalyzeJob}
                disabled={isAnalyzing || !jobText.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                Analyze Text
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Job Details Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building className="w-5 h-5 text-indigo-600 mr-2" />
          Job Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={data.jobTitle || ''}
              onChange={(e) => onUpdate({ ...data, jobTitle: e.target.value })}
              placeholder="e.g., Senior Software Engineer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company *
            </label>
            <input
              type="text"
              value={data.company || ''}
              onChange={(e) => onUpdate({ ...data, company: e.target.value })}
              placeholder="e.g., Tech Corp Inc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <input
              type="text"
              value={data.industry || ''}
              onChange={(e) => onUpdate({ ...data, industry: e.target.value })}
              placeholder="e.g., Technology, Healthcare"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={data.location || ''}
              onChange={(e) => onUpdate({ ...data, location: e.target.value })}
              placeholder="e.g., San Francisco, CA / Remote"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Size
            </label>
            <select
              value={data.companySize || ''}
              onChange={(e) => onUpdate({ ...data, companySize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select size</option>
              <option value="startup">Startup (1-50)</option>
              <option value="small">Small (51-200)</option>
              <option value="medium">Medium (201-1000)</option>
              <option value="large">Large (1000+)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary Range
            </label>
            <input
              type="text"
              value={data.salaryRange || ''}
              onChange={(e) => onUpdate({ ...data, salaryRange: e.target.value })}
              placeholder="e.g., $80k - $120k"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Key Requirements */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="w-5 h-5 text-indigo-600 mr-2" />
            Key Requirements
          </h3>
          <button
            onClick={addRequirement}
            className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
          >
            Add Requirement
          </button>
        </div>

        <div className="space-y-3">
          {(data.keyRequirements || []).length === 0 ? (
            <p className="text-gray-500 text-sm italic">No requirements added yet</p>
          ) : (
            (data.keyRequirements || []).map((req, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => updateRequirement(index, e.target.value)}
                  placeholder="e.g., 5+ years of React experience"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeRequirement(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Key Responsibilities */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Target className="w-5 h-5 text-indigo-600 mr-2" />
            Key Responsibilities
          </h3>
          <button
            onClick={addResponsibility}
            className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
          >
            Add Responsibility
          </button>
        </div>

        <div className="space-y-3">
          {(data.keyResponsibilities || []).length === 0 ? (
            <p className="text-gray-500 text-sm italic">No responsibilities added yet</p>
          ) : (
            (data.keyResponsibilities || []).map((resp, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  value={resp}
                  onChange={(e) => updateResponsibility(index, e.target.value)}
                  placeholder="e.g., Lead frontend development team"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeResponsibility(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}