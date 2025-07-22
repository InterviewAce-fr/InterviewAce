import React, { useState, useEffect } from 'react';
import { User, Briefcase, GraduationCap, Award, Target, Zap } from 'lucide-react';

interface Step4Props {
  data: any;
  onUpdate: (data: any) => void;
}

export default function Step4Profile({ data, onUpdate }: Step4Props) {
  const [formData, setFormData] = useState({
    personal_mission: data.personal_mission || '',
    career_objective: data.career_objective || '',
    key_skills: data.key_skills || [],
    relevant_experiences: data.relevant_experiences || [],
    achievements: data.achievements || [],
    education_highlights: data.education_highlights || [],
    certifications: data.certifications || [],
    profile_match_analysis: data.profile_match_analysis || '',
    ...data
  });

  useEffect(() => {
    onUpdate(formData);
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

  const analyzeWithAI = async () => {
    // This would integrate with your AI service and CV
    alert('AI analysis feature coming soon! This will analyze your CV and match it against the job requirements.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Profile & Experience Matching</h2>
            <p className="text-gray-600">
              Analyze how your background aligns with the role and identify your strongest selling points.
            </p>
          </div>
          <button
            onClick={analyzeWithAI}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Zap className="h-4 w-4" />
            <span>AI Analyze</span>
          </button>
        </div>
      </div>

      {/* Personal Mission & Objective */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Personal Mission</h3>
          </div>
          <textarea
            value={formData.personal_mission}
            onChange={(e) => handleInputChange('personal_mission', e.target.value)}
            placeholder="What drives you professionally? What impact do you want to make?"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Career Objective</h3>
          </div>
          <textarea
            value={formData.career_objective}
            onChange={(e) => handleInputChange('career_objective', e.target.value)}
            placeholder="What are your short and long-term career goals?"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Key Skills */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Key Skills</h3>
        </div>
        <div className="space-y-2">
          {formData.key_skills.map((skill: string, index: number) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={skill}
                onChange={(e) => handleArrayChange('key_skills', index, e.target.value)}
                placeholder="e.g., React.js, Project Management, Data Analysis"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => removeArrayItem('key_skills', index)}
                className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => addArrayItem('key_skills')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            + Add Skill
          </button>
        </div>
      </div>

      {/* Relevant Experiences */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Briefcase className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Relevant Experiences</h3>
        </div>
        <div className="space-y-3">
          {formData.relevant_experiences.map((experience: string, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <textarea
                value={experience}
                onChange={(e) => handleArrayChange('relevant_experiences', index, e.target.value)}
                placeholder="Describe a relevant work experience, project, or role that aligns with this position..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
              />
              <button
                onClick={() => removeArrayItem('relevant_experiences', index)}
                className="text-red-600 hover:text-red-800 text-sm transition-colors"
              >
                Remove Experience
              </button>
            </div>
          ))}
          <button
            onClick={() => addArrayItem('relevant_experiences')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            + Add Experience
          </button>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Key Achievements</h3>
        </div>
        <div className="space-y-2">
          {formData.achievements.map((achievement: string, index: number) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={achievement}
                onChange={(e) => handleArrayChange('achievements', index, e.target.value)}
                placeholder="e.g., Increased sales by 30%, Led team of 10 developers"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => removeArrayItem('achievements', index)}
                className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => addArrayItem('achievements')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            + Add Achievement
          </button>
        </div>
      </div>

      {/* Education & Certifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Education Highlights</h3>
          </div>
          <div className="space-y-2">
            {formData.education_highlights.map((education: string, index: number) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={education}
                  onChange={(e) => handleArrayChange('education_highlights', index, e.target.value)}
                  placeholder="e.g., MBA in Business Administration, Stanford University"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeArrayItem('education_highlights', index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => addArrayItem('education_highlights')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              + Add Education
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Certifications</h3>
          </div>
          <div className="space-y-2">
            {formData.certifications.map((certification: string, index: number) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={certification}
                  onChange={(e) => handleArrayChange('certifications', index, e.target.value)}
                  placeholder="e.g., AWS Certified Solutions Architect"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeArrayItem('certifications', index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => addArrayItem('certifications')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              + Add Certification
            </button>
          </div>
        </div>
      </div>

      {/* Profile Match Analysis */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Profile Match Analysis</h3>
        <textarea
          value={formData.profile_match_analysis}
          onChange={(e) => handleInputChange('profile_match_analysis', e.target.value)}
          placeholder="Analyze how your profile matches the job requirements. What are your strongest selling points? Where might you need to address gaps?"
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Profile Matching</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Focus on experiences that directly relate to the job requirements</li>
          <li>• Quantify your achievements with specific numbers and results</li>
          <li>• Identify transferable skills from different industries or roles</li>
          <li>• Be honest about gaps and show how you plan to address them</li>
          <li>• Prepare specific examples using the STAR method (Situation, Task, Action, Result)</li>
        </ul>
      </div>
    </div>
  );
}