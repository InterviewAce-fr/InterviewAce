import React, { useState } from 'react';
import { User, Target, CheckCircle, ArrowRight, Plus, X } from 'lucide-react';

interface Connection {
  id: string;
  from: { type: 'responsibility' | 'candidate' | 'desired'; index: number };
  to: { type: 'responsibility' | 'candidate' | 'desired'; index: number };
}

interface Step4ProfileProps {
  data: {
    key_responsibilities?: string[];
    candidate_experience?: string;
    candidate_education?: string;
    candidate_skills?: string[];
    desired_experience?: string;
    desired_education?: string;
    desired_skills?: string[];
    connections?: Connection[];
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

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ type: string; index: number; subtype?: string } | null>(null);

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

  const startConnection = (type: string, index: number, subtype?: string) => {
    if (isConnecting && connectionStart) {
      // Complete connection
      const newConnection: Connection = {
        id: `${Date.now()}-${Math.random()}`,
        from: { type: connectionStart.type as any, index: connectionStart.index },
        to: { type: type as any, index }
      };
      
      // Only allow valid connections (responsibility -> candidate, candidate -> desired)
      if ((connectionStart.type === 'responsibility' && type === 'candidate') ||
          (connectionStart.type === 'candidate' && type === 'desired')) {
        const updatedConnections = [...formData.connections, newConnection];
        handleInputChange('connections', updatedConnections);
      }
      
      setIsConnecting(false);
      setConnectionStart(null);
    } else {
      // Start connection
      setIsConnecting(true);
      setConnectionStart({ type, index, subtype });
    }
  };

  const removeConnection = (connectionId: string) => {
    const updatedConnections = formData.connections.filter(conn => conn.id !== connectionId);
    handleInputChange('connections', updatedConnections);
  };

  const cancelConnection = () => {
    setIsConnecting(false);
    setConnectionStart(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <User className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Matching Analysis</h2>
          <p className="text-gray-600 text-sm">
            Compare role requirements with your profile and the desired candidate profile
          </p>
        </div>

        {/* Connection Mode Toggle */}
        <div className="flex justify-center mb-6">
          {isConnecting ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-600">Click on items to create connections</span>
              <button
                onClick={cancelConnection}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConnecting(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Create Connections
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {/* Left Column: Key Responsibilities */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Target className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-800">Key Responsibilities</h3>
            </div>
            <p className="text-blue-700 text-xs mb-3">
              Main tasks and requirements for this role
            </p>
            
            <div className="space-y-2">
              {formData.key_responsibilities.map((responsibility, index) => (
                <div 
                  key={index} 
                  className={`flex items-center space-x-2 ${
                    isConnecting ? 'cursor-pointer' : ''
                  } ${
                    connectionStart?.type === 'responsibility' && connectionStart?.index === index 
                      ? 'ring-2 ring-blue-400' : ''
                  }`}
                  onClick={() => isConnecting && startConnection('responsibility', index)}
                >
                  <div className="flex-1 bg-white rounded-lg p-2 border border-blue-300 min-h-[40px]">
                    <input
                      type="text"
                      value={responsibility}
                      onChange={(e) => updateArrayItem('key_responsibilities', index, e.target.value)}
                      placeholder="Enter key responsibility..."
                      className="w-full bg-transparent border-none focus:outline-none text-xs"
                      disabled={isConnecting}
                    />
                  </div>
                  {!isConnecting && (
                    <button
                      onClick={() => removeArrayItem('key_responsibilities', index)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {!isConnecting && (
                <button
                  onClick={() => addArrayItem('key_responsibilities')}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Responsibility
                </button>
              )}
            </div>
          </div>

          {/* Middle Column: Candidate Profile */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <User className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-green-800">Your Profile</h3>
            </div>
            <p className="text-green-700 text-xs mb-3">
              Your current experience, education, and skills
            </p>
            
            <div className="space-y-3">
              {/* Experience */}
              <div 
                className={`bg-white rounded-lg p-3 border border-green-300 ${
                  isConnecting ? 'cursor-pointer' : ''
                } ${
                  connectionStart?.type === 'candidate' && connectionStart?.subtype === 'experience' 
                    ? 'ring-2 ring-green-400' : ''
                }`}
                onClick={() => isConnecting && startConnection('candidate', 0, 'experience')}
              >
                <label className="block text-xs font-medium text-green-800 mb-1">
                  Experience
                </label>
                <textarea
                  value={formData.candidate_experience}
                  onChange={(e) => handleInputChange('candidate_experience', e.target.value)}
                  placeholder="Describe your relevant experience..."
                  className="w-full bg-transparent border-none focus:outline-none text-xs resize-none"
                  rows={2}
                  disabled={isConnecting}
                />
              </div>

              {/* Education */}
              <div 
                className={`bg-white rounded-lg p-3 border border-green-300 ${
                  isConnecting ? 'cursor-pointer' : ''
                } ${
                  connectionStart?.type === 'candidate' && connectionStart?.subtype === 'education' 
                    ? 'ring-2 ring-green-400' : ''
                }`}
                onClick={() => isConnecting && startConnection('candidate', 1, 'education')}
              >
                <label className="block text-xs font-medium text-green-800 mb-1">
                  Education
                </label>
                <textarea
                  value={formData.candidate_education}
                  onChange={(e) => handleInputChange('candidate_education', e.target.value)}
                  placeholder="Your educational background..."
                  className="w-full bg-transparent border-none focus:outline-none text-xs resize-none"
                  rows={2}
                  disabled={isConnecting}
                />
              </div>

              {/* Skills */}
              <div className="bg-white rounded-lg p-3 border border-green-300">
                <label className="block text-xs font-medium text-green-800 mb-2">
                  Skills
                </label>
                <div className="space-y-1">
                  {formData.candidate_skills.map((skill, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center space-x-2 ${
                        isConnecting ? 'cursor-pointer' : ''
                      } ${
                        connectionStart?.type === 'candidate' && connectionStart?.index === index + 2
                          ? 'ring-2 ring-green-400 rounded' : ''
                      }`}
                      onClick={() => isConnecting && startConnection('candidate', index + 2)}
                    >
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => updateArrayItem('candidate_skills', index, e.target.value)}
                        placeholder="Enter skill..."
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                        disabled={isConnecting}
                      />
                      {!isConnecting && (
                        <button
                          onClick={() => removeArrayItem('candidate_skills', index)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {!isConnecting && (
                    <button
                      onClick={() => addArrayItem('candidate_skills')}
                      className="text-green-600 hover:text-green-800 text-xs font-medium"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Add Skill
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Desired Profile */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-purple-800">Desired Profile</h3>
            </div>
            <p className="text-purple-700 text-xs mb-3">
              What the company is looking for
            </p>
            
            <div className="space-y-3">
              {/* Experience */}
              <div 
                className={`bg-white rounded-lg p-3 border border-purple-300 ${
                  isConnecting ? 'cursor-pointer' : ''
                } ${
                  connectionStart?.type === 'desired' && connectionStart?.subtype === 'experience' 
                    ? 'ring-2 ring-purple-400' : ''
                }`}
                onClick={() => isConnecting && startConnection('desired', 0, 'experience')}
              >
                <label className="block text-xs font-medium text-purple-800 mb-1">
                  Experience
                </label>
                <textarea
                  value={formData.desired_experience}
                  onChange={(e) => handleInputChange('desired_experience', e.target.value)}
                  placeholder="Required experience level..."
                  className="w-full bg-transparent border-none focus:outline-none text-xs resize-none"
                  rows={2}
                  disabled={isConnecting}
                />
              </div>

              {/* Education */}
              <div 
                className={`bg-white rounded-lg p-3 border border-purple-300 ${
                  isConnecting ? 'cursor-pointer' : ''
                } ${
                  connectionStart?.type === 'desired' && connectionStart?.subtype === 'education' 
                    ? 'ring-2 ring-purple-400' : ''
                }`}
                onClick={() => isConnecting && startConnection('desired', 1, 'education')}
              >
                <label className="block text-xs font-medium text-purple-800 mb-1">
                  Education
                </label>
                <textarea
                  value={formData.desired_education}
                  onChange={(e) => handleInputChange('desired_education', e.target.value)}
                  placeholder="Required educational background..."
                  className="w-full bg-transparent border-none focus:outline-none text-xs resize-none"
                  rows={2}
                  disabled={isConnecting}
                />
              </div>

              {/* Skills */}
              <div className="bg-white rounded-lg p-3 border border-purple-300">
                <label className="block text-xs font-medium text-purple-800 mb-2">
                  Skills
                </label>
                <div className="space-y-1">
                  {formData.desired_skills.map((skill, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center space-x-2 ${
                        isConnecting ? 'cursor-pointer' : ''
                      } ${
                        connectionStart?.type === 'desired' && connectionStart?.index === index + 2
                          ? 'ring-2 ring-purple-400 rounded' : ''
                      }`}
                      onClick={() => isConnecting && startConnection('desired', index + 2)}
                    >
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => updateArrayItem('desired_skills', index, e.target.value)}
                        placeholder="Required skill..."
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                        disabled={isConnecting}
                      />
                      {!isConnecting && (
                        <button
                          onClick={() => removeArrayItem('desired_skills', index)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {!isConnecting && (
                    <button
                      onClick={() => addArrayItem('desired_skills')}
                      className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Add Skill
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Connection Lines */}
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {formData.connections.map((connection) => (
              <g key={connection.id}>
                <line
                  x1="33%"
                  y1="50%"
                  x2="66%"
                  y2="50%"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                <circle
                  cx="33%"
                  cy="50%"
                  r="4"
                  fill="#3b82f6"
                />
                <circle
                  cx="66%"
                  cy="50%"
                  r="4"
                  fill="#10b981"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Active Connections Display */}
        {formData.connections.length > 0 && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <ArrowRight className="w-4 h-4 mr-2" />
              Active Connections ({formData.connections.length})
            </h4>
            <div className="space-y-2">
              {formData.connections.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                  <span className="text-gray-700">
                    {connection.from.type} → {connection.to.type}
                  </span>
                  <button
                    onClick={() => removeConnection(connection.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Profile Matching Tips</h3>
          <div className="text-blue-700 text-xs space-y-1">
            <p><strong>Create Connections:</strong> Use the connection tool to visually link responsibilities to your skills and experience.</p>
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