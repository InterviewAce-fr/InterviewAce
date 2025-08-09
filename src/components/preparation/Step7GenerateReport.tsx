import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

interface Step7GenerateReportProps {
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

const Step7GenerateReport: React.FC<Step7GenerateReportProps> = ({
  data,
  onUpdate,
  allStepsData,
  preparationTitle
}) => {
  const [generating, setGenerating] = useState(false);
  const { profile } = useAuth();

  const generatePDF = async () => {
    setGenerating(true);
    
    try {
      // Generate HTML content for PDF
      const reportContent = generateHTMLReport();
      
      // Generate PDF using Puppeteer
      const pdfBlob = await generatePDFFromHTML(reportContent);
      
      // Download the PDF
      downloadPDF(pdfBlob, preparationTitle);
      
      toast.success('PDF report generated and downloaded successfully!');
      
      // Update the component state to show completion
      onUpdate({ 
        ...data, 
        completed: true,
        generatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const generateHTMLReport = (): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Interview Preparation Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0 0; font-size: 1.2em; opacity: 0.9; }
        .elevator-pitch { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
        .elevator-pitch h2 { margin-bottom: 15px; font-size: 1.8em; }
        .elevator-pitch p { font-size: 1.1em; line-height: 1.8; margin: 0; }
        .section { margin-bottom: 40px; }
        .section-title { font-size: 1.8em; font-weight: 600; margin-bottom: 20px; color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        .subsection { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #3498db; border-radius: 5px; }
        .subsection-title { font-weight: 600; color: #2c3e50; margin-bottom: 8px; }
        .list-item { margin: 8px 0; padding: 8px 12px; background: white; border-radius: 4px; border-left: 3px solid #e74c3c; }
        .canvas-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 20px 0; }
        .canvas-item { padding: 10px; border-radius: 6px; font-size: 12px; min-height: 80px; }
        .canvas-yellow { background: #fef3c7; border: 1px solid #f59e0b; }
        .canvas-orange { background: #fed7aa; border: 1px solid #ea580c; }
        .canvas-red { background: #fecaca; border: 1px solid #dc2626; }
        .canvas-purple { background: #e9d5ff; border: 1px solid #9333ea; }
        .canvas-pink { background: #fce7f3; border: 1px solid #ec4899; }
        .canvas-green { background: #dcfce7; border: 1px solid #16a34a; }
        .canvas-blue { background: #dbeafe; border: 1px solid #2563eb; }
        .canvas-indigo { background: #e0e7ff; border: 1px solid #4f46e5; }
        .canvas-gray { background: #f3f4f6; border: 1px solid #6b7280; }
        .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .swot-item { padding: 15px; border-radius: 8px; }
        .swot-strengths { background: #dcfce7; border: 2px solid #16a34a; }
        .swot-weaknesses { background: #fecaca; border: 2px solid #dc2626; }
        .swot-opportunities { background: #dbeafe; border: 2px solid #2563eb; }
        .swot-threats { background: #fef3c7; border: 2px solid #f59e0b; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 48px; color: rgba(0,0,0,0.05); z-index: -1; pointer-events: none; }
    </style>
</head>
<body>
    ${!profile?.is_premium ? '<div class="watermark">INTERVIEWACE FREE</div>' : ''}
    <div class="header">
        <h1>${preparationTitle || 'Interview Preparation Report'}</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    ${allStepsData.step5?.elevator_pitch ? `
    <div class="elevator-pitch">
        <h2>🎯 30-Second Elevator Pitch</h2>
        <p>${allStepsData.step5.elevator_pitch}</p>
    </div>` : ''}

    <div class="section">
        <h2 class="section-title">📋 Job Overview</h2>
        ${allStepsData.step1.job_title ? `<div class="subsection"><div class="subsection-title">Job Title:</div>${allStepsData.step1.job_title}</div>` : ''}
        ${allStepsData.step1.company_name ? `<div class="subsection"><div class="subsection-title">Company:</div>${allStepsData.step1.company_name}</div>` : ''}
        ${allStepsData.step1.location ? `<div class="subsection"><div class="subsection-title">Location:</div>${allStepsData.step1.location}</div>` : ''}
        ${allStepsData.step1.salary_range ? `<div class="subsection"><div class="subsection-title">Salary Range:</div>${allStepsData.step1.salary_range}</div>` : ''}
        ${allStepsData.step1.company_description ? `<div class="subsection"><div class="subsection-title">Company Description:</div>${allStepsData.step1.company_description}</div>` : ''}
        ${allStepsData.step1.key_responsibilities?.length ? `
        <div class="subsection">
            <div class="subsection-title">Key Responsibilities:</div>
            ${allStepsData.step1.key_responsibilities.map((resp: string) => `<div class="list-item">${resp}</div>`).join('')}
        </div>` : ''}
    </div>

    <div class="section">
        <h2 class="section-title">🏢 Business Model Canvas</h2>
        <div class="canvas-grid">
            <div class="canvas-item canvas-yellow">
                <div style="font-weight: bold; margin-bottom: 5px;">Key Partners</div>
                <div>${allStepsData.step2.key_partners || 'Not specified'}</div>
            </div>
            <div class="canvas-item canvas-orange">
                <div style="font-weight: bold; margin-bottom: 5px;">Key Activities</div>
                <div>${allStepsData.step2.key_activities || 'Not specified'}</div>
            </div>
            <div class="canvas-item canvas-red">
                <div style="font-weight: bold; margin-bottom: 5px;">Value Propositions</div>
                <div>${allStepsData.step2.value_propositions || 'Not specified'}</div>
            </div>
            <div class="canvas-item canvas-purple">
                <div style="font-weight: bold; margin-bottom: 5px;">Customer Relationships</div>
                <div>${allStepsData.step2.customer_relationships || 'Not specified'}</div>
            </div>
            <div class="canvas-item canvas-pink">
                <div style="font-weight: bold; margin-bottom: 5px;">Customer Segments</div>
                <div>${allStepsData.step2.customer_segments || 'Not specified'}</div>
            </div>
            <div class="canvas-item canvas-orange">
                <div style="font-weight: bold; margin-bottom: 5px;">Key Resources</div>
                <div>${allStepsData.step2.key_resources || 'Not specified'}</div>
            </div>
            <div class="canvas-item canvas-gray" style="grid-column: span 2;">
                <div style="text-align: center; padding-top: 20px;">
                    <div style="font-weight: bold;">Business Model</div>
                </div>
            </div>
            <div class="canvas-item canvas-indigo">
                <div style="font-weight: bold; margin-bottom: 5px;">Channels</div>
                <div>${allStepsData.step2.channels || 'Not specified'}</div>
            </div>
            <div class="canvas-item canvas-pink">
                <div style="font-weight: bold; margin-bottom: 5px;">Customer Segments</div>
                <div>${allStepsData.step2.customer_segments || 'Not specified'}</div>
            </div>
            <div class="canvas-item canvas-green" style="grid-column: span 2;">
                <div style="font-weight: bold; margin-bottom: 5px;">Cost Structure</div>
                <div>${allStepsData.step2.cost_structure || 'Not specified'}</div>
            </div>
            <div class="canvas-item canvas-blue" style="grid-column: span 3;">
                <div style="font-weight: bold; margin-bottom: 5px;">Revenue Streams</div>
                <div>${allStepsData.step2.revenue_streams || 'Not specified'}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">📊 SWOT Analysis</h2>
        <div class="swot-grid">
            <div class="swot-item swot-strengths">
                <h4 style="font-weight: bold; margin-bottom: 10px;">Strengths</h4>
                ${allStepsData.step3.strengths?.length ? 
                    allStepsData.step3.strengths.map((item: string) => `<div>• ${item}</div>`).join('') : 
                    '<div style="color: #666;">No strengths identified</div>'
                }
            </div>
            <div class="swot-item swot-weaknesses">
                <h4 style="font-weight: bold; margin-bottom: 10px;">Weaknesses</h4>
                ${allStepsData.step3.weaknesses?.length ? 
                    allStepsData.step3.weaknesses.map((item: string) => `<div>• ${item}</div>`).join('') : 
                    '<div style="color: #666;">No weaknesses identified</div>'
                }
            </div>
            <div class="swot-item swot-opportunities">
                <h4 style="font-weight: bold; margin-bottom: 10px;">Opportunities</h4>
                ${allStepsData.step3.opportunities?.length ? 
                    allStepsData.step3.opportunities.map((item: string) => `<div>• ${item}</div>`).join('') : 
                    '<div style="color: #666;">No opportunities identified</div>'
                }
            </div>
            <div class="swot-item swot-threats">
                <h4 style="font-weight: bold; margin-bottom: 10px;">Threats</h4>
                ${allStepsData.step3.threats?.length ? 
                    allStepsData.step3.threats.map((item: string) => `<div>• ${item}</div>`).join('') : 
                    '<div style="color: #666;">No threats identified</div>'
                }
            </div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">👤 Your Matching Experience</h2>
        ${allStepsData.step4.role_mission ? `<div class="subsection"><div class="subsection-title">Role Mission & Key Responsibilities:</div>${allStepsData.step4.role_mission}</div>` : ''}
        ${allStepsData.step4.ideal_profile ? `<div class="subsection"><div class="subsection-title">Company's Ideal Profile:</div>${allStepsData.step4.ideal_profile}</div>` : ''}
        ${allStepsData.step4.matching_experiences?.length ? `<div class="subsection"><div class="subsection-title">Your Matching Experience:</div>${allStepsData.step4.matching_experiences.map((exp: string) => `<div class="list-item">${exp}</div>`).join('')}</div>` : ''}
    </div>

    <div class="section">
        <h2 class="section-title">💡 Your Motivation & Questions</h2>
        ${allStepsData.step5.why_you ? `<div class="subsection"><div class="subsection-title">Why You?</div>${allStepsData.step5.why_you}</div>` : ''}
        ${allStepsData.step5.why_them ? `<div class="subsection"><div class="subsection-title">Why Them?</div>${allStepsData.step5.why_them}</div>` : ''}
        ${allStepsData.step5.why_this_role ? `<div class="subsection"><div class="subsection-title">Why This Role?</div>${allStepsData.step5.why_this_role}</div>` : ''}
        ${allStepsData.step6.questions_to_ask?.length ? `
        <div class="subsection">
            <div class="subsection-title">Questions to Ask Them:</div>
            ${allStepsData.step6.questions_to_ask.map((q: string) => `<div class="list-item">${q}</div>`).join('')}
        </div>` : ''}
    </div>

    <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
        Generated by InterviewAce ${!profile?.is_premium ? '(Free Version)' : ''}
    </div>
</body>
</html>
    `;
  };

  const generatePDFFromHTML = async (htmlContent: string): Promise<Blob> => {
    // Import Puppeteer dynamically
    const puppeteer = await import('puppeteer');
    
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    return new Blob([pdfBuffer], { type: 'application/pdf' });
  };

  const downloadPDF = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/[^a-zA-Z0-9]/g, '-')}-report.pdf`;
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

    const completedSteps = steps.filter(step => 
      step && Object.keys(step).length > 0
    ).length;

    return {
      completed: completedSteps,
      total: 6,
      percentage: Math.round((completedSteps / 6) * 100)
    };
  };

  const stats = getCompletionStats();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Generate Your Report</h2>
          <p className="text-gray-600">
            Create a comprehensive PDF report of your interview preparation
          </p>
        </div>

        {/* Completion Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Preparation Overview</h3>
            <div className="text-sm text-gray-600">
              {stats.completed} of {stats.total} steps completed ({stats.percentage}%)
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${stats.percentage}%` }}
            ></div>
          </div>

          {/* Step Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Job Analysis', data: allStepsData.step1 },
              { name: 'Business Model', data: allStepsData.step2 },
              { name: 'SWOT Analysis', data: allStepsData.step3 },
              { name: 'Your Experience', data: allStepsData.step4 },
              { name: 'Why Questions', data: allStepsData.step5 },
              { name: 'Interview Questions', data: allStepsData.step6 }
            ].map((step, index) => {
              const isCompleted = step.data && Object.keys(step.data).length > 0;
              return (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  )}
                  <span className={`text-sm ${isCompleted ? 'text-gray-800' : 'text-gray-500'}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generate Report Section */}
        <div className="text-center">
          {stats.completed === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">
                No Data to Generate Report
              </h4>
              <p className="text-yellow-700">
                Please complete at least one preparation step before generating your report.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">
                Ready to Generate Report
              </h4>
              <p className="text-blue-700 mb-4">
                Your report will include all completed preparation steps with professional formatting.
              </p>
              
              <button
                onClick={generatePDF}
                disabled={generating || stats.completed === 0}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Generate PDF Report
                  </>
                )}
              </button>
            </div>
          )}

          {!profile?.is_premium && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-600">
                Free users get watermarked reports. 
                <a href="/premium" className="text-blue-600 hover:underline ml-1">
                  Upgrade to Premium
                </a> for clean, professional reports.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step7GenerateReport;