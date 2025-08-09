import React, { useState } from 'react';
import { Globe, Loader2, Zap, Building, Target, Users, Briefcase } from 'lucide-react';
import { aiService } from '../../lib/aiService';
import { toast } from '../ui/Toast';

interface Step1Data {
  jobTitle?: string;
  companyName?: string;
  jobUrl?: string;
  jobDescription?: string;
  keyRequirements?: string[];
  keyResponsibilities?: string[];
  companyInfo?: string;
  salaryRange?: string;
  location?: string;
  workType?: string;
}

interface Step1Props {
  data: Step1Data;
  onUpdate: (data: Step1Data) => void;
}

const Step1JobAnalysis: React.FC<Step1Props> = ({ data, onUpdate }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMethod, setAnalysisMethod] = useState<'url' | 'text'>('url');

  const handleChange = (field: keyof Step1Data, value: string | string[]) => {
    onUpdate({ ...data, [field]: value });
  };

  const addRequirement = () => {
    const requirements = data.keyRequirements || [];
    onUpdate({ ...data, keyRequirements: [...requirements, ''] });
  };

  const updateRequirement = (index: number, value: string) => {
    const requirements = [...(data.keyRequirements || [])];
    requirements[index] = value;
    onUpdate({ ...data, keyRequirements: requirements });
  };

  const removeRequirement = (index: number) => {
    const requirements = data.keyRequirements || [];
    onUpdate({ ...data, keyRequirements: requirements.filter((_, i) => i !== index) });
  };

  const addResponsibility = () => {
    const responsibilities = data.keyResponsibilities || [];
    onUpdate({ ...data, keyResponsibilities: [...responsibilities, ''] });
  };

  const updateResponsibility = (index: number, value: string) => {
    const responsibilities = [...(data.keyResponsibilities || [])];
    responsibilities[index] = value;
    onUpdate({ ...data, keyResponsibilities: responsibilities });
  };

  const removeResponsibility = (index: number) => {
    const responsibilities = data.keyResponsibilities || [];
    onUpdate({ ...data, keyResponsibilities: responsibilities.filter((_, i) => i !== index) });
  };

  const analyzeJobPosting = async () => {
    if (analysisMethod === 'url' && !data.jobUrl) {
      toast.error('Please enter a job posting URL');
      return;
    }
    if (analysisMethod === 'text' && !data.jobDescription) {
      toast.error('Please enter the job description text');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      let analysisData;
      
      if (analysisMethod === 'url') {
        analysisData = await aiService.analyzeJobFromUrl(data.jobUrl!);
      } else {
        analysisData = await aiService.analyzeJobFromText(data.jobDescription!);
      }
      
      onUpdate({
        ...data,
        jobTitle: analysisData.jobTitle,
        companyName: analysisData.companyName,
        keyRequirements: analysisData.keyRequirements,
        keyResponsibilities: analysisData.keyResponsibilities,
        companyInfo: analysisData.companyInfo,
        salaryRange: analysisData.salaryRange,
        location: analysisData.location,
        workType: analysisData.workType
      });
      
      toast.success('Job posting analyzed successfully!');
      
    } catch (error) {
      console.error('Job analysis error:', error);
      toast.error('Failed to analyze job posting. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Analysis</h2>
        <p className="text-gray-600">
          Analyze the job posting to understand the role, requirements, and company better.
        </p>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="h-5 w-5 text-purple-600 mr-2" />
          AI-Powered Job Analysis
        </h3>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="url"
                checked={analysisMethod === 'url'}
                onChange={(e) => setAnalysisMethod(e.target.value as 'url' | 'text')}
                className="mr-2"
              />
              Analyze from URL
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="text"
                checked={analysisMethod === 'text'}
                onChange={(e) => setAnalysisMethod(e.target.value as 'url' | 'text')}
                className="mr-2"
              />
              Analyze from Text
            </label>
          </div>

          {analysisMethod === 'url' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Posting URL
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    value={data.jobUrl || ''}
                    onChange={(e) => handleChange('jobUrl', e.target.value)}
                    placeholder="https://company.com/jobs/position"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={analyzeJobPosting}
                  disabled={isAnalyzing || !data.jobUrl}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description Text
              </label>
              <div className="space-y-2">
                <textarea
                  value={data.jobDescription || ''}
                  onChange={(e) => handleChange('jobDescription', e.target.value)}
                  placeholder="Paste the complete job description here..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={analyzeJobPosting}
                  disabled={isAnalyzing || !data.jobDescription}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Briefcase className="inline h-4 w-4 mr-1" />
            Job Title
          </label>
          <input
            type="text"
            value={data.jobTitle || ''}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="inline h-4 w-4 mr-1" />
            Company Name
          </label>
          <input
            type="text"
            value={data.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="e.g., Tech Corp Inc."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={data.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="e.g., San Francisco, CA"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Work Type
          </label>
          <select
            value={data.workType || ''}
            onChange={(e) => handleChange('workType', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select work type</option>
            <option value="Remote">Remote</option>
            <option value="On-site">On-site</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Key Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Target className="inline h-4 w-4 mr-1" />
          Key Requirements
        </label>
        <div className="space-y-2">
          {(data.keyRequirements || []).map((requirement, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={requirement}
                onChange={(e) => updateRequirement(index, e.target.value)}
                placeholder="e.g., 5+ years of React experience"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => removeRequirement(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addRequirement}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            + Add Requirement
          </button>
        </div>
      </div>

      {/* Key Responsibilities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Users className="inline h-4 w-4 mr-1" />
          Key Responsibilities
        </label>
        <div className="space-y-2">
          {(data.keyResponsibilities || []).map((responsibility, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={responsibility}
                onChange={(e) => updateResponsibility(index, e.target.value)}
                placeholder="e.g., Lead frontend development team"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => removeResponsibility(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addResponsibility}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            + Add Responsibility
          </button>
        </div>
      </div>

      {/* Company Information */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Information
        </label>
        <textarea
          value={data.companyInfo || ''}
          onChange={(e) => handleChange('companyInfo', e.target.value)}
          placeholder="Brief description of the company, its mission, values, and culture..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Salary Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Salary Range (Optional)
        </label>
        <input
          type="text"
          value={data.salaryRange || ''}
          onChange={(e) => handleChange('salaryRange', e.target.value)}
          placeholder="e.g., $120,000 - $150,000"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default Step1JobAnalysis;