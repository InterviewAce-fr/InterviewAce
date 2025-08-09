import React, { useState } from 'react';
import { FileText, Loader2, Download, CheckCircle, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Step7GenerateReportProps {
  data: any;
  onUpdate: (data: any) => void;
  preparation: any;
}

const Step7GenerateReport: React.FC<Step7GenerateReportProps> = ({ preparation }) => {
  const { user, session, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!preparation || !session?.access_token) {
      alert('Authentication required to generate report.');
      return;
    }

    setLoading(true);
    setJobId(null);
    setJobStatus(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/pdf/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          preparationData: {
            id: preparation.id,
            title: preparation.title,
            job_url: preparation.job_url,
            step_1_data: preparation.step_1_data,
            step_2_data: preparation.step_2_data,
            step_3_data: preparation.step_3_data,
            step_4_data: preparation.step_4_data,
            step_5_data: preparation.step_5_data,
            step_6_data: preparation.step_6_data,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to generate PDF');
      }

      if (profile?.is_premium) {
        const data = await response.json();
        setJobId(data.jobId);
        setJobStatus('queued');
        alert('PDF generation started. You will receive an email when ready.');
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${preparation.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        alert('PDF downloaded successfully!');
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert(error.message || 'Failed to generate PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Generate Your Report</h2>
      <p className="text-gray-600 mb-6">
        Click the button below to generate a professional PDF report of your preparation.
      </p>

      <button
        onClick={handleGenerateReport}
        disabled={loading}
        className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="animate-spin h-6 w-6 mr-3" />
        ) : (
          <Download className="h-6 w-6 mr-3" />
        )}
        {loading ? 'Generating...' : 'Generate PDF Report'}
      </button>

      {profile?.is_premium && jobId && ( 
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          <Crown className="w-5 h-5 inline mr-2" />
          <p className="font-medium">Report generation queued (Job ID: {jobId}).</p>
          <p className="text-sm">You will receive an email with your report shortly.</p>
        </div>
      )}

      <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 Report Tips</h3>
        <ul className="text-gray-700 text-sm space-y-2 text-left">
          <li>• Ensure all steps are completed for a comprehensive report.</li>
          <li>• Premium users receive clean, watermark-free PDFs via email.</li>
          <li>• Free users can download a watermarked PDF directly.</li>
          <li>• Review your report before your interview to refresh your memory.</li>
        </ul>
      </div>
    </div>
  );
};

export default Step7GenerateReport;