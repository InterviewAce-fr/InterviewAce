import React, { useState } from 'react';
import { Upload, Loader2, Zap, User, Award, Briefcase, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { aiService } from '../../lib/aiService';
import { toast } from '../ui/Toast';

interface MatchResult {
  skill: string;
  grade: 'High' | 'Moderate' | 'Low';
  score: number;
  reasoning: string;
}

interface MatchingResults {
  overallScore: number;
  matches: MatchResult[];
  distribution: {
    high: number;
    moderate: number;
    low: number;
  };
}

interface Step4Data {
  candidateProfile?: string;
  keyResponsibilities?: string[];
  keySkills?: string[];
  education?: string[];
  experience?: string[];
  cvText?: string;
  matchingResults?: MatchingResults;
}

interface Step4Props {
  data: Step4Data;
  onUpdate: (data: Step4Data) => void;
  jobData?: any; // From Step 1
}

const Step4Profile: React.FC<Step4Props> = ({ data, onUpdate, jobData }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const handleChange = (field: keyof Step4Data, value: string | string[]) => {
    onUpdate({ ...data, [field]: value });
  };

  const addSkill = () => {
    const skills = data.keySkills || [];
    onUpdate({ ...data, keySkills: [...skills, ''] });
  };

  const updateSkill = (index: number, value: string) => {
    const skills = [...(data.keySkills || [])];
    skills[index] = value;
    onUpdate({ ...data, keySkills: skills });
  };

  const removeSkill = (index: number) => {
    const skills = data.keySkills || [];
    onUpdate({ ...data, keySkills: skills.filter((_, i) => i !== index) });
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

  const addEducation = () => {
    const education = data.education || [];
    onUpdate({ ...data, education: [...education, ''] });
  };

  const updateEducation = (index: number, value: string) => {
    const education = [...(data.education || [])];
    education[index] = value;
    onUpdate({ ...data, education: education });
  };

  const removeEducation = (index: number) => {
    const education = data.education || [];
    onUpdate({ ...data, education: education.filter((_, i) => i !== index) });
  };

  const addExperience = () => {
    const experience = data.experience || [];
    onUpdate({ ...data, experience: [...experience, ''] });
  };

  const updateExperience = (index: number, value: string) => {
    const experience = [...(data.experience || [])];
    experience[index] = value;
    onUpdate({ ...data, experience: experience });
  };

  const removeExperience = (index: number) => {
    const experience = data.experience || [];
    onUpdate({ ...data, experience: experience.filter((_, i) => i !== index) });
  };

  const analyzeCVText = async () => {
    if (!data.cvText) {
      toast.error('Please enter your CV text');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const cvData = await aiService.parseCVText(data.cvText);
      
      onUpdate({
        ...data,
        keySkills: cvData.skills,
        education: cvData.education,
        experience: cvData.experience,
        candidateProfile: cvData.summary
      });
      
      toast.success('CV analyzed successfully!');
      
    } catch (error) {
      console.error('CV analysis error:', error);
      toast.error('Failed to analyze CV. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performMatching = async () => {
    if (!jobData || !data.keySkills?.length) {
      toast.error('Please complete job analysis in Step 1 and add your skills first.');
      return;
    }

    setIsMatching(true);
    
    try {
      const matchingResults = await aiService.performMatching(
        data.keySkills,
        data.keyResponsibilities || [],
        jobData.keyRequirements || [],
        jobData.keyResponsibilities || []
      );
      
      onUpdate({
        ...data,
        matchingResults
      });
      
      toast.success('Matching analysis completed!');
      
    } catch (error) {
      console.error('Matching error:', error);
      toast.error('Failed to perform matching analysis. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'High': return 'text-green-600 bg-green-100';
      case 'Moderate': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case 'High': return <TrendingUp className="h-4 w-4" />;
      case 'Moderate': return <Minus className="h-4 w-4" />;
      case 'Low': return <TrendingDown className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Profile & Experience</h2>
        <p className="text-gray-600">
          Analyze your CV and profile to understand how well you match the job requirements.
        </p>
      </div>

      {/* AI CV Analysis Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="h-5 w-5 text-blue-600 mr-2" />
          AI-Powered CV Analysis
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CV Text
            </label>
            <textarea
              value={data.cvText || ''}
              onChange={(e) => handleChange('cvText', e.target.value)}
              placeholder="Paste your complete CV text here for AI analysis..."
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={analyzeCVText}
              disabled={isAnalyzing || !data.cvText}
              className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? 'Analyzing CV...' : 'Analyze CV'}
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Profile */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="inline h-4 w-4 mr-1" />
          Candidate Profile Summary
        </label>
        <textarea
          value={data.candidateProfile || ''}
          onChange={(e) => handleChange('candidateProfile', e.target.value)}
          placeholder="Brief summary of your professional background, key strengths, and career objectives..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Key Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Award className="inline h-4 w-4 mr-1" />
          Key Skills
        </label>
        <div className="space-y-2">
          {(data.keySkills || []).map((skill, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={skill}
                onChange={(e) => updateSkill(index, e.target.value)}
                placeholder="e.g., React, Node.js, Python"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => removeSkill(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addSkill}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            + Add Skill
          </button>
        </div>
      </div>

      {/* Key Responsibilities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Briefcase className="inline h-4 w-4 mr-1" />
          Key Responsibilities (Current/Previous Roles)
        </label>
        <div className="space-y-2">
          {(data.keyResponsibilities || []).map((responsibility, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={responsibility}
                onChange={(e) => updateResponsibility(index, e.target.value)}
                placeholder="e.g., Led a team of 5 developers to build scalable web applications"
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

      {/* Education */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Education
        </label>
        <div className="space-y-2">
          {(data.education || []).map((edu, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={edu}
                onChange={(e) => updateEducation(index, e.target.value)}
                placeholder="e.g., Bachelor's in Computer Science, MIT (2018)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => removeEducation(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addEducation}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            + Add Education
          </button>
        </div>
      </div>

      {/* Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Work Experience
        </label>
        <div className="space-y-2">
          {(data.experience || []).map((exp, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={exp}
                onChange={(e) => updateExperience(index, e.target.value)}
                placeholder="e.g., Senior Developer at TechCorp (2020-2023)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => removeExperience(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addExperience}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            + Add Experience
          </button>
        </div>
      </div>

      {/* Matching Analysis */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="h-5 w-5 text-green-600 mr-2" />
          AI Matching Analysis
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Compare your skills and experience against the job requirements to see how well you match.
          </p>
          
          <button
            onClick={performMatching}
            disabled={isMatching || !jobData || !data.keySkills?.length}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isMatching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {isMatching ? 'Analyzing Match...' : 'Analyze Match'}
          </button>

          {data.matchingResults && (
            <div className="mt-6 space-y-4">
              {/* Overall Score */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-2">Overall Match Score</h4>
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold text-indigo-600">
                    {Math.round(data.matchingResults.overallScore)}%
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${data.matchingResults.overallScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Distribution */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-3">Match Distribution</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {data.matchingResults.distribution.high}
                    </div>
                    <div className="text-sm text-gray-600">High Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {data.matchingResults.distribution.moderate}
                    </div>
                    <div className="text-sm text-gray-600">Moderate Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {data.matchingResults.distribution.low}
                    </div>
                    <div className="text-sm text-gray-600">Low Matches</div>
                  </div>
                </div>
              </div>

              {/* Individual Matches */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-3">Detailed Skill Matches</h4>
                <div className="space-y-3">
                  {data.matchingResults.matches.map((match, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{match.skill}</div>
                        <div className="text-sm text-gray-600 mt-1">{match.reasoning}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getGradeColor(match.grade)}`}>
                          {getGradeIcon(match.grade)}
                          <span>{match.grade}</span>
                        </span>
                        <div className="text-sm font-medium text-gray-600">
                          {Math.round(match.score * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step4Profile;