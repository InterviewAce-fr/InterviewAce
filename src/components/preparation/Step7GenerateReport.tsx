import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

interface Step7GenerateReportProps {
  data: {
    step_1_data: any;
    step_2_data: any;
    step_3_data: any;
    step_4_data: any;
    step_5_data: any;
    step_6_data: any;
  };
  onSave: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Step7GenerateReport: React.FC<Step7GenerateReportProps> = ({
  data,
  onSave,
  onNext,
  onPrev
}) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Interview Preparation Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              margin: 40px;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
            }
            .section { 
              margin-bottom: 30px; 
              page-break-inside: avoid;
            }
            .section-title { 
              font-size: 18px; 
              font-weight: bold; 
              color: #1f2937;
              margin-bottom: 15px;
              border-left: 4px solid #3b82f6;
              padding-left: 15px;
            }
            .elevator-pitch {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              border-radius: 10px;
              margin-bottom: 30px;
              text-align: center;
            }
            .canvas-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
              grid-template-rows: 1fr 1fr;
              gap: 10px;
              margin: 20px 0;
              height: 400px;
            }
            .canvas-item {
              border: 2px solid #e5e7eb;
              padding: 15px;
              border-radius: 8px;
              background: #f9fafb;
            }
            .canvas-item h4 {
              margin: 0 0 10px 0;
              font-size: 14px;
              font-weight: bold;
              color: #374151;
            }
            .canvas-item ul {
              margin: 0;
              padding-left: 15px;
              font-size: 12px;
            }
            .swot-matrix {
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: 1fr 1fr;
              gap: 15px;
              margin: 20px 0;
              height: 300px;
            }
            .swot-item {
              padding: 20px;
              border-radius: 8px;
              border: 2px solid;
            }
            .swot-strengths { background: #dcfce7; border-color: #16a34a; }
            .swot-weaknesses { background: #fef3c7; border-color: #d97706; }
            .swot-opportunities { background: #dbeafe; border-color: #2563eb; }
            .swot-threats { background: #fecaca; border-color: #dc2626; }
            .swot-item h4 {
              margin: 0 0 10px 0;
              font-weight: bold;
            }
            .swot-item ul {
              margin: 0;
              padding-left: 15px;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 72px;
              color: rgba(0,0,0,0.1);
              z-index: -1;
              pointer-events: none;
            }
          </style>
        </head>
        <body>
          ${!user?.is_premium ? '<div class="watermark">FREE VERSION</div>' : ''}
          
          <div class="header">
            <h1>Interview Preparation Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          ${data.step_5_data?.elevatorPitch ? `
          <div class="elevator-pitch">
            <h2>30-Second Elevator Pitch</h2>
            <p>${data.step_5_data.elevatorPitch}</p>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Job Analysis</div>
            <p><strong>Company:</strong> ${data.step_1_data?.company || 'N/A'}</p>
            <p><strong>Role:</strong> ${data.step_1_data?.role || 'N/A'}</p>
            <p><strong>Job Description:</strong></p>
            <p>${data.step_1_data?.jobDescription || 'N/A'}</p>
          </div>

          <div class="section">
            <div class="section-title">Business Model Canvas</div>
            <div class="canvas-grid">
              <div class="canvas-item">
                <h4>Key Partners</h4>
                <ul>
                  ${data.step_2_data?.keyPartners?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
              <div class="canvas-item">
                <h4>Key Activities</h4>
                <ul>
                  ${data.step_2_data?.keyActivities?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
              <div class="canvas-item">
                <h4>Value Propositions</h4>
                <ul>
                  ${data.step_2_data?.valuePropositions?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
              <div class="canvas-item">
                <h4>Customer Relationships</h4>
                <ul>
                  ${data.step_2_data?.customerRelationships?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
              <div class="canvas-item">
                <h4>Customer Segments</h4>
                <ul>
                  ${data.step_2_data?.customerSegments?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
              <div class="canvas-item">
                <h4>Key Resources</h4>
                <ul>
                  ${data.step_2_data?.keyResources?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
              <div class="canvas-item">
                <h4>Channels</h4>
                <ul>
                  ${data.step_2_data?.channels?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
              <div class="canvas-item">
                <h4>Cost Structure</h4>
                <ul>
                  ${data.step_2_data?.costStructure?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
              <div class="canvas-item">
                <h4>Revenue Streams</h4>
                <ul>
                  ${data.step_2_data?.revenueStreams?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">SWOT Analysis</div>
            <div class="swot-matrix">
              <div class="swot-item swot-strengths">
                <h4>Strengths</h4>
                <ul>
                  ${data.step_3_data?.strengths?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
              <div class="swot-item swot-weaknesses">
                <h4>Weaknesses</h4>
                <ul>
                  ${data.step_3_data?.weaknesses?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
              <div class="swot-item swot-opportunities">
                <h4>Opportunities</h4>
                <ul>
                  ${data.step_3_data?.opportunities?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
              <div class="swot-item swot-threats">
                <h4>Threats</h4>
                <ul>
                  ${data.step_3_data?.threats?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Not specified</li>'}
                </ul>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Your Matching Experience</div>
            <p><strong>Role Mission & Key Responsibilities:</strong></p>
            <p>${data.step_4_data?.roleMission || 'N/A'}</p>
            <p><strong>Company's Ideal Profile:</strong></p>
            <p>${data.step_4_data?.idealProfile || 'N/A'}</p>
            <p><strong>Your Matching Experience:</strong></p>
            <p>${data.step_4_data?.matchingExperience || 'N/A'}</p>
          </div>

          <div class="section">
            <div class="section-title">Why Questions</div>
            <p><strong>Why You?</strong></p>
            <p>${data.step_5_data?.whyYou || 'N/A'}</p>
            <p><strong>Why Them?</strong></p>
            <p>${data.step_5_data?.whyThem || 'N/A'}</p>
            <p><strong>Why This Role?</strong></p>
            <p>${data.step_5_data?.whyRole || 'N/A'}</p>
          </div>

          <div class="section">
            <div class="section-title">Interview Questions</div>
            ${data.step_6_data?.questions?.map((q: any, index: number) => `
              <div style="margin-bottom: 20px;">
                <p><strong>Q${index + 1}: ${q.question}</strong></p>
                <p>${q.answer}</p>
              </div>
            `).join('') || '<p>No questions prepared</p>'}
            
            <h4>Questions to Ask Them:</h4>
            ${data.step_6_data?.questionsForThem?.map((q: string, index: number) => `
              <p>${index + 1}. ${q}</p>
            `).join('') || '<p>No questions prepared</p>'}
          </div>
        </body>
        </html>
      `;

      // Create a blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'interview-preparation-report.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Generate Your Report
          </h2>
          <p className="text-gray-600">
            Create a comprehensive PDF report with all your interview preparation
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Your Report Will Include:
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">30-Second Elevator Pitch</h4>
                <p className="text-sm text-gray-600">Your compelling introduction</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Job Analysis</h4>
                <p className="text-sm text-gray-600">Complete role breakdown</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Visual Business Model Canvas</h4>
                <p className="text-sm text-gray-600">Complete 9-section framework</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">SWOT Matrix</h4>
                <p className="text-sm text-gray-600">Visual 2x2 analysis grid</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Your Matching Experience</h4>
                <p className="text-sm text-gray-600">Role alignment analysis</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Why Questions & Interview Prep</h4>
                <p className="text-sm text-gray-600">Complete Q&A preparation</p>
              </div>
            </div>
          </div>
        </div>

        {!user?.is_premium && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800">Free Version</h4>
                <p className="text-sm text-yellow-700">
                  Your report will include a watermark. Upgrade to Premium for watermark-free reports.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Generate PDF Report
              </>
            )}
          </button>
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            onClick={onPrev}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Previous Step
          </button>
          <button
            onClick={onNext}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Complete Journey →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step7GenerateReport;