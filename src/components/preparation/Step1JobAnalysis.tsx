import React, { useState, useEffect } from 'react';
import { Search, Globe, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { aiService } from '../../lib/aiService';

interface Step1Data {
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  keyRequirements: string[];
  keyResponsibilities: string[];
  jobDescription: string;
}

interface Step1JobAnalysisProps {
  data: Step1Data;
  onUpdate: (data: Step1Data) => void;
}

export default function Step1JobAnalysis({ data, onUpdate }: Step1JobAnalysisProps) {
  const [jobInput, setJobInput] = useState(data.jobUrl || '');
  const [jobText, setJobText] = useState(data.jobDescription || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');

  const handleAnalyzeJob = async () => {
    if (!jobInput.trim() && !jobText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisStatus('idle');

    try {
      let result;
      
      if (inputMode === 'url' && jobInput.trim()) {
        result = await aiService.analyzeJobFromUrl(jobInput.trim());
      } else if (inputMode === 'text' && jobText.trim()) {
        result = await aiService.analyzeJobFromText(jobText.trim());
      } else {
        throw new Error('Please provide either a job URL or job description text');
      }

      // Update the data with AI analysis results
      const updatedData: Step1Data = {
        ...data,
        jobTitle: result.job_title || data.jobTitle,
        companyName: result.company_name || data.companyName,
        jobUrl: inputMode === 'url' ? jobInput : data.jobUrl,
        jobDescription: inputMode === 'text' ? jobText : result.job_description || data.jobDescription,
        keyRequirements: result.required_profile || data.keyRequirements,
        keyResponsibilities: result.responsibilities || data.keyResponsibilities,
      };

      onUpdate(updatedData);
      setAnalysisStatus('success');
    } catch (error) {
      console.error('Job analysis failed:', error);
      setAnalysisStatus('error');
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      alert(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualUpdate = (field: keyof Step1Data, value: string | string[]) => {
    onUpdate({
      ...data,
      [field]: value,
    });
  };

  const addRequirement = () => {
    const newRequirements = [...data.keyRequirements, ''];
    handleManualUpdate('keyRequirements', newRequirements);
  };

  const updateRequirement = (index: number, value: string) => {
    const newRequirements = [...data.keyRequirements];
    newRequirements[index] = value;
    handleManualUpdate('keyRequirements', newRequirements);
  };

  const removeRequirement = (index: number) => {
    const newRequirements = data.keyRequirements.filter((_, i) => i !== index);
    handleManualUpdate('keyRequirements', newRequirements);
  };

  const addResponsibility = () => {
    const newResponsibilities = [...data.keyResponsibilities, ''];
    handleManualUpdate('keyResponsibilities', newResponsibilities);
  };

  const updateResponsibility = (index: number, value: string) => {
    const newResponsibilities = [...data.keyResponsibilities];
    newResponsibilities[index] = value;
    handleManualUpdate('keyResponsibilities', newResponsibilities);
  };

  const removeResponsibility = (index: number) => {
    const newResponsibilities = data.keyResponsibilities.filter((_, i) => i !== index);
    handleManualUpdate('keyResponsibilities', newResponsibilities);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Job Analysis</h2>
        <p className="text-lg text-gray-600">
          Let's analyze the job posting to understand what they're looking for
        </p>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Job Analysis</h3>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setInputMode('url')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMode === 'url'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            Job URL
          </button>
          <button
            onClick={() => setInputMode('text')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMode === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Job Text
          </button>
        </div>

        {inputMode === 'url' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Posting URL
              </label>
              <input
                type="url"
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                placeholder="https://company.com/careers/job-posting"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description Text
              </label>
              <textarea
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste the job description here..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleAnalyzeJob}
          disabled={isAnalyzing || (!jobInput.trim() && !jobText.trim())}
          className="w-full mt-4 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing Job...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Analyze Job
            </>
          )}
        </button>

        {analysisStatus === 'success' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Job analysis completed successfully!</span>
          </div>
        )}

        {analysisStatus === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">Analysis failed. Please try again or fill manually.</span>
          </div>
        )}
      </div>

      {/* Manual Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={data.jobTitle}
            onChange={(e) => handleManualUpdate('jobTitle', e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={data.companyName}
            onChange={(e) => handleManualUpdate('companyName', e.target.value)}
            placeholder="e.g., Tech Corp"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Key Requirements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Key Requirements
          </label>
          <button
            onClick={addRequirement}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            + Add Requirement
          </button>
        </div>
        <div className="space-y-3">
          {data.keyRequirements.map((requirement, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={requirement}
                onChange={(e) => updateRequirement(index, e.target.value)}
                placeholder="e.g., 5+ years of React experience"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => removeRequirement(index)}
                className="px-3 py-2 text-red-600 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
          {data.keyRequirements.length === 0 && (
            <p className="text-gray-500 text-sm italic">No requirements added yet</p>
          )}
        </div>
      </div>

      {/* Key Responsibilities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Key Responsibilities
          </label>
          <button
            onClick={addResponsibility}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            + Add Responsibility
          </button>
        </div>
        <div className="space-y-3">
          {data.keyResponsibilities.map((responsibility, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={responsibility}
                onChange={(e) => updateResponsibility(index, e.target.value)}
                placeholder="e.g., Develop and maintain web applications"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => removeResponsibility(index)}
                className="px-3 py-2 text-red-600 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
          {data.keyResponsibilities.length === 0 && (
            <p className="text-gray-500 text-sm italic">No responsibilities added yet</p>
          )}
        </div>
      </div>
    </div>
  );
}