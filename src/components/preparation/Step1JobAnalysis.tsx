import React, { useState } from 'react';
import { Search, Globe, FileText, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [jobInput, setJobInput] = useState('');
  const [inputType, setInputType] = useState<'url' | 'text'>('url');

  const handleAnalyzeJob = async () => {
    if (!jobInput.trim()) return;

    setIsAnalyzing(true);
    setAnalysisStatus('idle');

    try {
      let analysisResult;
      
      if (inputType === 'url') {
        analysisResult = await aiService.analyzeJobFromUrl(jobInput);
      } else {
        analysisResult = await aiService.analyzeJobFromText(jobInput);
      }

      onUpdate({
        ...data,
        jobTitle: analysisResult.job_title || data.jobTitle,
        companyName: analysisResult.company_name || data.companyName,
        jobUrl: inputType === 'url' ? jobInput : data.jobUrl,
        keyRequirements: analysisResult.required_profile || data.keyRequirements,
        keyResponsibilities: analysisResult.responsibilities || data.keyResponsibilities,
        jobDescription: inputType === 'text' ? jobInput : data.jobDescription
      });

      setAnalysisStatus('success');
    } catch (error) {
      console.error('Job analysis failed:', error);
      setAnalysisStatus('error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addRequirement = () => {
    onUpdate({
      ...data,
      keyRequirements: [...data.keyRequirements, '']
    });
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...data.keyRequirements];
    updated[index] = value;
    onUpdate({
      ...data,
      keyRequirements: updated
    });
  };

  const removeRequirement = (index: number) => {
    onUpdate({
      ...data,
      keyRequirements: data.keyRequirements.filter((_, i) => i !== index)
    });
  };

  const addResponsibility = () => {
    onUpdate({
      ...data,
      keyResponsibilities: [...data.keyResponsibilities, '']
    });
  };

  const updateResponsibility = (index: number, value: string) => {
    const updated = [...data.keyResponsibilities];
    updated[index] = value;
    onUpdate({
      ...data,
      keyResponsibilities: updated
    });
  };

  const removeResponsibility = (index: number) => {
    onUpdate({
      ...data,
      keyResponsibilities: data.keyResponsibilities.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Analysis</h2>
        <p className="text-gray-600">
          Analyze the job posting to understand requirements and responsibilities
        </p>
      </div>

      {/* AI Job Analysis Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Job Analysis</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setInputType('url')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                inputType === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Job URL
            </button>
            <button
              onClick={() => setInputType('text')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                inputType === 'text'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Job Text
            </button>
          </div>

          <div>
            {inputType === 'url' ? (
              <input
                type="url"
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                placeholder="https://company.com/job-posting"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <textarea
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                placeholder="Paste the job description here..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleAnalyzeJob}
              disabled={!jobInput.trim() || isAnalyzing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Job
                </>
              )}
            </button>

            {analysisStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Analysis complete!</span>
              </div>
            )}

            {analysisStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Analysis failed. Please try again.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Basic Job Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={data.jobTitle}
            onChange={(e) => onUpdate({ ...data, jobTitle: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Senior Software Engineer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={data.companyName}
            onChange={(e) => onUpdate({ ...data, companyName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., TechCorp Inc."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job URL (Optional)
        </label>
        <input
          type="url"
          value={data.jobUrl}
          onChange={(e) => onUpdate({ ...data, jobUrl: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://company.com/careers/job-id"
        />
      </div>

      {/* Key Requirements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Key Requirements
          </label>
          <button
            onClick={addRequirement}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Requirement
          </button>
        </div>
        <div className="space-y-3">
          {data.keyRequirements.map((requirement, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={requirement}
                onChange={(e) => updateRequirement(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 5+ years of React experience"
              />
              <button
                onClick={() => removeRequirement(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Remove
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
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Responsibility
          </button>
        </div>
        <div className="space-y-3">
          {data.keyResponsibilities.map((responsibility, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={responsibility}
                onChange={(e) => updateResponsibility(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Lead frontend development team"
              />
              <button
                onClick={() => removeResponsibility(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Remove
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