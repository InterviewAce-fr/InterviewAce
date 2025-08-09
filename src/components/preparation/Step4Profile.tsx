import React, { useState } from 'react';
import { User, Target, CheckCircle } from 'lucide-react';

interface Step4ProfileProps {
  data: {
    role_mission?: string;
    ideal_profile?: string;
    matching_experiences?: string[];
  };
  onUpdate: (data: any) => void;
}

const Step4Profile: React.FC<Step4ProfileProps> = ({ data, onUpdate }) => {
  const [formData, setFormData] = useState({
    role_mission: data.role_mission || '',
    ideal_profile: data.ideal_profile || '',
    matching_experiences: data.matching_experiences || []
  });

  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const addExperience = () => {
    const updatedExperiences = [...formData.matching_experiences, ''];
    const updatedData = { ...formData, matching_experiences: updatedExperiences };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const updateExperience = (index: number, value: string) => {
    const updatedExperiences = [...formData.matching_experiences];
    updatedExperiences[index] = value;
    const updatedData = { ...formData, matching_experiences: updatedExperiences };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const removeExperience = (index: number) => {
    const updatedExperiences = formData.matching_experiences.filter((_, i) => i !== index);
    const updatedData = { ...formData, matching_experiences: updatedExperiences };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Matching Experience</h2>
          <p className="text-gray-600">
            Analyze how your experience aligns with what they're looking for
          </p>
        </div>

        <div className="space-y-8">
          {/* Role Mission & Key Responsibilities */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Target className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-blue-800">
                A) Role Mission & Key Responsibilities
              </h3>
            </div>
            <p className="text-blue-700 text-sm mb-4">
              What is this role about? What are the main responsibilities and mission?
            </p>
            <textarea
              value={formData.role_mission}
              onChange={(e) => handleInputChange('role_mission', e.target.value)}
              placeholder="Describe the role's mission and key responsibilities..."
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Company's Ideal Profile */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <User className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="text-xl font-semibold text-purple-800">
                B) Company's Ideal Profile
              </h3>
            </div>
            <p className="text-purple-700 text-sm mb-4">
              What profile is the company looking for? What are their requirements and expectations?
            </p>
            <textarea
              value={formData.ideal_profile}
              onChange={(e) => handleInputChange('ideal_profile', e.target.value)}
              placeholder="Describe the ideal candidate profile they're seeking..."
              className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Your Matching Experience */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-xl font-semibold text-green-800">
                C) Your Matching Experience
              </h3>
            </div>
            <p className="text-green-700 text-sm mb-4">
              How does your experience align with what they're looking for? List specific examples.
            </p>
            
            <div className="space-y-3">
              {formData.matching_experiences.map((experience, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={experience}
                      onChange={(e) => updateExperience(index, e.target.value)}
                      placeholder="Describe a specific experience that matches their requirements..."
                      className="w-full px-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={() => removeExperience(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800 font-medium"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <button
                onClick={addExperience}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                + Add Matching Experience
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 Matching Tips</h3>
          <div className="text-gray-700 text-sm space-y-2">
            <p><strong>Be Specific:</strong> Use concrete examples with measurable results when possible.</p>
            <p><strong>Show Impact:</strong> Explain how your experience created value or solved problems.</p>
            <p><strong>Connect the Dots:</strong> Clearly link your experience to their specific requirements.</p>
            <p><strong>Use Their Language:</strong> Mirror the terminology and keywords from the job description.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4Profile;