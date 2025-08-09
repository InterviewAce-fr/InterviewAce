import React, { useState } from 'react';
import { User, Target, CheckCircle, ArrowRight } from 'lucide-react';

interface Step4ProfileProps {
  data: {
    key_responsibilities?: string[];
    candidate_experience?: string;
    candidate_education?: string;
    candidate_skills?: string[];
    desired_experience?: string;
    desired_education?: string;
    desired_skills?: string[];
    connections?: Array<{
      from: string;
      to: string;
      type: 'responsibility-to-candidate' | 'candidate-to-desired';
    }>;
  };
  onUpdate: (data: any) => void;
}

const Step4Profile: React.FC<Step4ProfileProps> = ({ data, onUpdate }) => {
  const [formData, setFormData] = useState({
    key_responsibilities: data.key_responsibilities || [],
    candidate_experience: data.candidate_experience || '',
    candidate_education: data.candidate_education || '',
    candidate_skills: data.candidate_skills || [],
    desired_experience: data.desired_experience || '',
    desired_education: data.desired_education || '',
    desired_skills: data.desired_skills || [],
    connections: data.connections || []
  });

  const handleInputChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const addArrayItem = (field: string) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    handleInputChange(field, [...currentArray, '']);
  };

  const updateArrayItem = (field: string, index: number, value: string) => {
    const currentArray = [...(formData[field as keyof typeof formData] as string[])];
    currentArray[index] = value;
    handleInputChange(field, currentArray);
  };

  const removeArrayItem = (field: string, index: number) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    const newArray = currentArray.filter((_, i) => i !== index);
    handleInputChange(field, newArray);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Profile Matching Analysis</h2>
          <p className="text-gray-600">
            Compare role requirements with your profile and the desired candidate profile
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Key Responsibilities */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Target className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-blue-800">Key Responsibilities</h3>
            </div>
            <p className="text-blue-700 text-sm mb-4">
              Main tasks and requirements for this role
            </p>
            
            <div className="space-y-3">
              {formData.key_responsibilities.map((responsibility, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1 bg-white rounded-lg p-3 border border-blue-300">
                    <input
                      type="text"
                      value={responsibility}
                      onChange={(e) => updateArrayItem('key_responsibilities', index, e.target.value)}
                      placeholder="Enter key responsibility..."
                      className="w-full bg-transparent border-none focus:outline-none text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removeArrayItem('key_responsibilities', index)}
                    className="px-2 py-1 text-red-600 hover:text-red-800 font-medium"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => addArrayItem('key_responsibilities')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Add Responsibility
              </button>
            </div>
          </div>

          {/* Middle Column: Candidate Profile */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <User className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-xl font-semibold text-green-800">Your Profile</h3>
            </div>
            <p className="text-green-700 text-sm mb-4">
              Your current experience, education, and skills
            </p>
            
            <div className="space-y-4">
              {/* Experience */}
              <div className="bg-white rounded-lg p-4 border border-green-300">
                <label className="block text-sm font-medium text-green-800 mb-2">
                  Experience
                </label>
                <textarea
                  value={formData.candidate_experience}
                  onChange={(e) => handleInputChange('candidate_experience', e.target.value)}
                  placeholder="Describe your relevant experience..."
                  className="w-full bg-transparent border-none focus:outline-none text-sm resize-none"
                  rows={3}
                />
              </div>

              {/* Education */}
              <div className="bg-white rounded-lg p-4 border border-green-300">
                <label className="block text-sm font-medium text-green-800 mb-2">
                  Education
                </label>
                <textarea
                  value={formData.candidate_education}
                  onChange={(e) => handleInputChange('candidate_education', e.target.value)}
                  placeholder="Your educational background..."
                  className="w-full bg-transparent border-none focus:outline-none text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Skills */}
              <div className="bg-white rounded-lg p-4 border border-green-300">
                <label className="block text-sm font-medium text-green-800 mb-2">
                  Skills
                </label>
                <div className="space-y-2">
                  {formData.candidate_skills.map((skill, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => updateArrayItem('candidate_skills', index, e.target.value)}
                        placeholder="Enter skill..."
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      <button
                        onClick={() => removeArrayItem('candidate_skills', index)}
                        className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem('candidate_skills')}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    + Add Skill
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Desired Profile */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="text-xl font-semibold text-purple-800">Desired Profile</h3>
            </div>
            <p className="text-purple-700 text-sm mb-4">
              What the company is looking for
            </p>
            
            <div className="space-y-4">
              {/* Experience */}
              <div className="bg-white rounded-lg p-4 border border-purple-300">
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  Experience
                </label>
                <textarea
                  value={formData.desired_experience}
                  onChange={(e) => handleInputChange('desired_experience', e.target.value)}
                  placeholder="Required experience level..."
                  className="w-full bg-transparent border-none focus:outline-none text-sm resize-none"
                  rows={3}
                />
              </div>

              {/* Education */}
              <div className="bg-white rounded-lg p-4 border border-purple-300">
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  Education
                </label>
                <textarea
                  value={formData.desired_education}
                  onChange={(e) => handleInputChange('desired_education', e.target.value)}
                  placeholder="Required educational background..."
                  className="w-full bg-transparent border-none focus:outline-none text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Skills */}
              <div className="bg-white rounded-lg p-4 border border-purple-300">
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  Skills
                </label>
                <div className="space-y-2">
                  {formData.desired_skills.map((skill, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => updateArrayItem('desired_skills', index, e.target.value)}
                        placeholder="Required skill..."
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => removeArrayItem('desired_skills', index)}
                        className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem('desired_skills')}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    + Add Skill
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Visualization */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <ArrowRight className="w-5 h-5 mr-2" />
            Profile Matching Connections
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Visualize how your profile connects to the role requirements and desired qualifications.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-gray-800 mb-3">Responsibilities → Your Profile</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Draw connections from key responsibilities to your matching experience and skills</p>
                <p>• Identify gaps where you may need to strengthen your profile</p>
                <p>• Highlight your strongest matches for interview talking points</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-gray-800 mb-3">Your Profile → Desired Profile</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Compare your qualifications with their ideal candidate</p>
                <p>• Identify areas where you exceed expectations</p>
                <p>• Prepare explanations for any qualification gaps</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Profile Matching Tips</h3>
          <div className="text-blue-700 text-sm space-y-2">
            <p><strong>Be Specific:</strong> Use concrete examples and measurable achievements when describing your profile.</p>
            <p><strong>Show Growth:</strong> Highlight how your experience has prepared you for increased responsibilities.</p>
            <p><strong>Address Gaps:</strong> Be prepared to explain how you'll bridge any qualification gaps.</p>
            <p><strong>Emphasize Strengths:</strong> Focus on areas where you exceed their requirements.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4Profile;