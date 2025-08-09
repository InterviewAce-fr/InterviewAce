import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../ui/Toast';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Crown, 
  Loader2,
  Star,
  Award,
  Target
} from 'lucide-react';

interface Step7Props {
  data: any;
  onUpdate: (data: any) => void;
  allStepsData: {
    step1: any;
    step2: any;
    step3: any;
    step4: any;
    step5: any;
    step6: any;
  };
  preparationTitle: string;
}

export default function Step7GenerateReport({ data, onUpdate, allStepsData, preparationTitle }: Step7Props) {
  const { profile } = useAuth();
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    
    try {
      // Simulate PDF generation for now since backend isn't connected
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // This would be the actual API call:
      // const response = await fetch('/api/pdf/generate', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     preparationData: {
      //       title: preparationTitle,
      //       ...allStepsData
      //     }
      //   })
      // });
      
      toast.success('PDF report generated successfully!');
      
      // Mark preparation as complete
      onUpdate({ ...data, completed: true });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setGenerating(false);
    }
  };

  const getCompletionStats = () => {
    const steps = [
      allStepsData.step1,
      allStepsData.step2,
      allStepsData.step3,
      allStepsData.step4,
      allStepsData.step5,
      allStepsData.step6
    ];
    
    const completedSteps = steps.filter(step => 
      step && typeof step === 'object' && Object.keys(step).length > 0
    ).length;
    
    return { completed: completedSteps, total: 6 };
  };

  const stats = getCompletionStats();
  const isFullyComplete = stats.completed === stats.total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Congratulations!
          </h2>
          <p className="text-gray-600 text-lg">
            You've completed your interview preparation journey
          </p>
        </div>
      </div>

      {/* Completion Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preparation Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">{stats.completed}</div>
            <div className="text-sm text-blue-700">Steps Completed</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">
              {Math.round((stats.completed / stats.total) * 100)}%
            </div>
            <div className="text-sm text-green-700">Progress</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900">Ready</div>
            <div className="text-sm text-purple-700">For Interview</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{stats.completed}/{stats.total} steps</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
              style={{ width: `${(stats.completed / stats.total) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { step: 1, title: 'Job Analysis', data: allStepsData.step1 },
            { step: 2, title: 'Business Model', data: allStepsData.step2 },
            { step: 3, title: 'SWOT Analysis', data: allStepsData.step3 },
            { step: 4, title: 'Profile Match', data: allStepsData.step4 },
            { step: 5, title: 'Why Questions', data: allStepsData.step5 },
            { step: 6, title: 'Interview Questions', data: allStepsData.step6 }
          ].map((item) => {
            const isComplete = item.data && Object.keys(item.data).length > 0;
            return (
              <div key={item.step} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isComplete ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {isComplete ? '✓' : item.step}
                </div>
                <span className={`font-medium ${
                  isComplete ? 'text-green-800' : 'text-gray-600'
                }`}>
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PDF Generation */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Generate Your Professional Report
          </h3>
          <p className="text-gray-600 mb-6">
            Create a comprehensive A4 PDF report with all your preparation insights
          </p>

          {/* Premium vs Free Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Free Report Includes:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All 6 preparation steps</li>
                <li>• Professional formatting</li>
                <li>• Watermarked PDF</li>
                <li>• Basic styling</li>
              </ul>
            </div>
            
            {profile?.is_premium ? (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-800">Premium Report</h4>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Clean, professional PDF</li>
                  <li>• No watermarks</li>
                  <li>• Enhanced formatting</li>
                  <li>• Email delivery</li>
                </ul>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Premium Features:</h4>
                <ul className="text-sm text-blue-700 space-y-1 mb-3">
                  <li>• Clean, professional PDF</li>
                  <li>• No watermarks</li>
                  <li>• Enhanced formatting</li>
                  <li>• Email delivery</li>
                </ul>
                <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors">
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={generatePDF}
            disabled={generating || !isFullyComplete}
            className={`inline-flex items-center space-x-2 px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 ${
              !isFullyComplete
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : generating
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Generate PDF Report</span>
              </>
            )}
          </button>

          {!isFullyComplete && (
            <p className="text-sm text-red-600 mt-2">
              Please complete all preparation steps before generating your report
            </p>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🚀 You're Ready!</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Before the Interview:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Review your PDF report</li>
              <li>• Practice your answers aloud</li>
              <li>• Research recent company news</li>
              <li>• Prepare your questions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">During the Interview:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Stay confident and authentic</li>
              <li>• Use specific examples (STAR method)</li>
              <li>• Ask thoughtful questions</li>
              <li>• Show enthusiasm</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">After the Interview:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Send a thank-you email</li>
              <li>• Follow up appropriately</li>
              <li>• Reflect on the experience</li>
              <li>• Prepare for next rounds</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}