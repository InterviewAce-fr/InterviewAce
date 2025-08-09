import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Users, Target, TrendingUp, User, HelpCircle, MessageSquare } from 'lucide-react';

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
  profile?: {
    is_premium?: boolean;
  };
}

const Step7GenerateReport: React.FC<Step7Props> = ({
  data,
  onUpdate,
  allStepsData,
  preparationTitle,
  profile
}) => {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    
    try {
      // Simulate PDF generation with better user feedback
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // This would be the actual API call:
      // const response = await fetch('/api/pdf/generate', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     preparationData: allStepsData,
      //     title: preparationTitle
      //   })
      // });
      
      // For now, we'll create a downloadable HTML version
      const reportContent = generateHTMLReport();
      downloadHTMLReport(reportContent, preparationTitle);
      
      // Show success message
      alert('Report generated and downloaded successfully!');
      
      // Update the component state to show completion
      onUpdate({ 
        ...data, 
        completed: true,
        generatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const generateHTMLReport = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Preparation Report - ${preparationTitle}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
        .section-title { color: #667eea; font-size: 1.5em; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
        .subsection { margin-bottom: 15px; }
        .subsection-title { font-weight: bold; color: #555; margin-bottom: 8px; }
        .list-item { background: #f8f9fa; margin: 5px 0; padding: 8px; border-radius: 4px; border-left: 3px solid #667eea; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 48px; color: rgba(0,0,0,0.05); z-index: -1; }
    </style>
</head>
<body>
    ${!profile?.is_premium ? '<div class="watermark">INTERVIEWACE FREE</div>' : ''}
    <div class="header">
        <h1>Interview Preparation Report</h1>
        <h2>${preparationTitle}</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    
    ${Object.keys(allStepsData.step1).length > 0 ? `
    <div class="section">
        <h2 class="section-title">📋 Job Analysis</h2>
        ${allStepsData.step1.job_title ? `<div class="subsection"><div class="subsection-title">Job Title:</div>${allStepsData.step1.job_title}</div>` : ''}
        ${allStepsData.step1.company_name ? `<div class="subsection"><div class="subsection-title">Company:</div>${allStepsData.step1.company_name}</div>` : ''}
        ${allStepsData.step1.key_requirements?.length ? `
        <div class="subsection">
            <div class="subsection-title">Key Requirements:</div>
            ${allStepsData.step1.key_requirements.map((req: string) => `<div class="list-item">${req}</div>`).join('')}
        </div>` : ''}
    </div>` : ''}
    
    ${Object.keys(allStepsData.step2).length > 0 ? `
    <div class="section">
        <h2 class="section-title">🏢 Business Model Canvas</h2>
        ${allStepsData.step2.value_propositions ? `<div class="subsection"><div class="subsection-title">Value Propositions:</div>${allStepsData.step2.value_propositions}</div>` : ''}
        ${allStepsData.step2.customer_segments ? `<div class="subsection"><div class="subsection-title">Customer Segments:</div>${allStepsData.step2.customer_segments}</div>` : ''}
    </div>` : ''}
    
    ${Object.keys(allStepsData.step3).length > 0 ? `
    <div class="section">
        <h2 class="section-title">⚖️ SWOT Analysis</h2>
        ${allStepsData.step3.strengths?.length ? `<div class="subsection"><div class="subsection-title">Strengths:</div>${allStepsData.step3.strengths.map((item: string) => `<div class="list-item">${item}</div>`).join('')}</div>` : ''}
        ${allStepsData.step3.weaknesses?.length ? `<div class="subsection"><div class="subsection-title">Weaknesses:</div>${allStepsData.step3.weaknesses.map((item: string) => `<div class="list-item">${item}</div>`).join('')}</div>` : ''}
    </div>` : ''}
    
    ${Object.keys(allStepsData.step4).length > 0 ? `
    <div class="section">
        <h2 class="section-title">👤 Profile & Experience</h2>
        ${allStepsData.step4.personal_mission ? `<div class="subsection"><div class="subsection-title">Personal Mission:</div>${allStepsData.step4.personal_mission}</div>` : ''}
        ${allStepsData.step4.key_skills?.length ? `<div class="subsection"><div class="subsection-title">Key Skills:</div>${allStepsData.step4.key_skills.map((skill: string) => `<div class="list-item">${skill}</div>`).join('')}</div>` : ''}
    </div>` : ''}
    
    ${Object.keys(allStepsData.step5).length > 0 ? `
    <div class="section">
        <h2 class="section-title">❓ The "Why" Questions</h2>
        ${allStepsData.step5.why_you ? `<div class="subsection"><div class="subsection-title">Why You?</div>${allStepsData.step5.why_you}</div>` : ''}
        ${allStepsData.step5.why_them ? `<div class="subsection"><div class="subsection-title">Why Them?</div>${allStepsData.step5.why_them}</div>` : ''}
        ${allStepsData.step5.elevator_pitch ? `<div class="subsection"><div class="subsection-title">Elevator Pitch:</div>${allStepsData.step5.elevator_pitch}</div>` : ''}
    </div>` : ''}
    
    ${Object.keys(allStepsData.step6).length > 0 ? `
    <div class="section">
        <h2 class="section-title">💬 Interview Questions</h2>
        ${allStepsData.step6.questions?.length ? allStepsData.step6.questions.map((q: any) => `
        <div class="subsection">
            <div class="subsection-title">Q: ${q.question}</div>
            <div>${q.answer || 'No answer prepared yet'}</div>
        </div>`).join('') : ''}
    </div>` : ''}
    
    <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
        Generated by InterviewAce ${!profile?.is_premium ? '(Free Version)' : ''}
    </div>
</body>
</html>`;
  };

  const downloadHTMLReport = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/[^a-zA-Z0-9]/g, '-')}-report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    const completedSteps = steps.filter(step => Object.keys(step).length > 0).length;
    return { completed: completedSteps, total: 6 };
  };

  const stats = getCompletionStats();
  const isReadyToGenerate = stats.completed >= 3; // At least 3 steps completed

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Congratulations! 🎉
        </h1>
        <p className="text-lg text-gray-600">
          You've completed your interview preparation journey
        </p>
      </div>

      {/* Completion Stats */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-600" />
          Preparation Summary
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Steps Completed</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((stats.completed / stats.total) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">Ready</div>
            <div className="text-sm text-gray-600">For Interview</div>
          </div>
        </div>

        {/* Step Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Users className="w-5 h-5 mr-3 text-blue-600" />
            <div>
              <div className="font-medium">Job Analysis</div>
              <div className="text-sm text-gray-600">
                {Object.keys(allStepsData.step1).length > 0 ? '✅ Complete' : '⏳ Pending'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <TrendingUp className="w-5 h-5 mr-3 text-green-600" />
            <div>
              <div className="font-medium">Business Model</div>
              <div className="text-sm text-gray-600">
                {Object.keys(allStepsData.step2).length > 0 ? '✅ Complete' : '⏳ Pending'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Target className="w-5 h-5 mr-3 text-purple-600" />
            <div>
              <div className="font-medium">SWOT Analysis</div>
              <div className="text-sm text-gray-600">
                {Object.keys(allStepsData.step3).length > 0 ? '✅ Complete' : '⏳ Pending'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 mr-3 text-orange-600" />
            <div>
              <div className="font-medium">Profile & Experience</div>
              <div className="text-sm text-gray-600">
                {Object.keys(allStepsData.step4).length > 0 ? '✅ Complete' : '⏳ Pending'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <HelpCircle className="w-5 h-5 mr-3 text-red-600" />
            <div>
              <div className="font-medium">Why Questions</div>
              <div className="text-sm text-gray-600">
                {Object.keys(allStepsData.step5).length > 0 ? '✅ Complete' : '⏳ Pending'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <MessageSquare className="w-5 h-5 mr-3 text-indigo-600" />
            <div>
              <div className="font-medium">Interview Questions</div>
              <div className="text-sm text-gray-600">
                {Object.keys(allStepsData.step6).length > 0 ? '✅ Complete' : '⏳ Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Report Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-green-600" />
          Generate Your Report
        </h2>
        
        <p className="text-gray-600 mb-6">
          Create a comprehensive PDF report with all your preparation materials, 
          including job analysis, SWOT analysis, interview questions, and more.
        </p>

        {!isReadyToGenerate && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              Complete at least 3 preparation steps to generate your report.
            </p>
          </div>
        )}

        <button
          onClick={generatePDF}
          disabled={generating || !isReadyToGenerate}
          className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
            generating || !isReadyToGenerate
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating Report...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Generate PDF Report
            </>
          )}
        </button>

        {!profile?.is_premium && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Free Version:</strong> Your report will include a watermark. 
              Upgrade to Premium for professional, watermark-free reports.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step7GenerateReport;