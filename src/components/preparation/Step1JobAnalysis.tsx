import React, { useState, useEffect } from 'react';
import { Link2, Building, MapPin, DollarSign, Clock, Users, Zap } from 'lucide-react';

interface Step1Props {
  data: any;
  onUpdate: (data: any) => void;
  jobUrl?: string;
  preparationTitle?: string;
  onTitleUpdate?: (title: string) => void;
}

export default function Step1JobAnalysis({ data, onUpdate, jobUrl, preparationTitle, onTitleUpdate }: Step1Props) {
  const [formData, setFormData] = useState({
    job_url: jobUrl || data.job_url || '',
    job_title: data.job_title || '',
    company_name: data.company_name || '',
    location: data.location || '',
    salary_range: data.salary_range || '',
    employment_type: data.employment_type || '',
    experience_level: data.experience_level || '',
    key_requirements: data.key_requirements || [],
    key_responsibilities: data.key_responsibilities || [],
    company_description: data.company_description || '',
    benefits: data.benefits || [],
    ...data
  });

  useEffect(() => {
    onUpdate(formData);
    
    // Update preparation title if job title is available
    if (formData.job_title && formData.company_name && onTitleUpdate) {
      const title = `${formData.job_title} at ${formData.company_name}`;
      if (title !== preparationTitle) {
        onTitleUpdate(title);
      }
    }
  }, [formData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    const newArray = [...(formData[field as keyof typeof formData] as string[])];
    newArray[index] = value;
    handleInputChange(field, newArray);
  };

  const addArrayItem = (field: string) => {
    const currentArray = (formData[field as keyof typeof formData] as string[]) || [];
    handleInputChange(field, [...currentArray, '']);
  };

  const removeArrayItem = (field: string, index: number) => {
    const newArray = [...(formData[field as keyof typeof formData] as string[])];
    newArray.splice(index, 1);
    handleInputChange(field, newArray);
  };

  const analyzeJobPosting = async () => {
    // This would integrate with your AI service
    // For now, we'll show a placeholder
    alert('AI analysis feature coming soon! This will automatically extract job details from the URL.');
  };

  return (
    <div className="space-y-6">
      {/* Job URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Posting URL
        </label>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Link2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="url"
              value={formData.job_url}
              onChange={(e) => handleInputChange('job_url', e.target.value)}
              placeholder="https://company.com/jobs/position"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={analyzeJobPosting}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Zap className="h-4 w-4" />
            <span>Analyze</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Paste the job posting URL and click "Analyze" to auto-fill details
        </p>
      </div>

      {/* Basic Job Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title *
          </label>
          <input
            type="text"
            value={formData.job_title}
            onChange={(e) => handleInputChange('job_title', e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="e.g., Google"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., San Francisco, CA"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Range
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={formData.salary_range}
              onChange={(e) => handleInputChange('salary_range', e.target.value)}
              placeholder="e.g., $120k - $180k"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employment Type
          </label>
          <select
            value={formData.employment_type}
            onChange={(e) => handleInputChange('employment_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select type</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="freelance">Freelance</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience Level
          </label>
          <select
            value={formData.experience_level}
            onChange={(e) => handleInputChange('experience_level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select level</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="lead">Lead/Principal</option>
            <option value="executive">Executive</option>
          </select>
        </div>
      </div>

      {/* Company Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Description
        </label>
        <textarea
          value={formData.company_description}
          onChange={(e) => handleInputChange('company_description', e.target.value)}
          placeholder="Brief description of the company, its mission, and culture..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Key Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Key Requirements
        </label>
        <div className="space-y-2">
          {formData.key_requirements.map((requirement: string, index: number) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={requirement}
                onChange={(e) => handleArrayChange('key_requirements', index, e.target.value)}
                placeholder="e.g., 5+ years of React experience"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => removeArrayItem('key_requirements', index)}
                className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => addArrayItem('key_requirements')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            + Add Requirement
          </button>
        </div>
      </div>

      {/* Key Responsibilities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Key Responsibilities
        </label>
        <div className="space-y-2">
          {formData.key_responsibilities.map((responsibility: string, index: number) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={responsibility}
                onChange={(e) => handleArrayChange('key_responsibilities', index, e.target.value)}
                placeholder="e.g., Lead frontend development team"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => removeArrayItem('key_responsibilities', index)}
                className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => addArrayItem('key_responsibilities')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            + Add Responsibility
          </button>
        </div>
      </div>

      {/* Benefits */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Benefits & Perks
        </label>
        <div className="space-y-2">
          {formData.benefits.map((benefit: string, index: number) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={benefit}
                onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                placeholder="e.g., Health insurance, Remote work"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => removeArrayItem('benefits', index)}
                className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => addArrayItem('benefits')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            + Add Benefit
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Job Analysis</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Copy the exact job posting URL for AI analysis</li>
          <li>• Focus on the most important requirements and responsibilities</li>
          <li>• Note any specific technologies, tools, or methodologies mentioned</li>
          <li>• Pay attention to company culture and values described</li>
        </ul>
      </div>
    </div>
  );
}