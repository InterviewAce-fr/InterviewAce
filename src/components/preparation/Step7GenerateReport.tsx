import React, { useEffect, useState } from 'react';
import { FileText, Loader2, Download, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface Step7GenerateReportProps {
  data?: any;
  onUpdate?: (data: any) => void;
  preparation: any;
}

const ensureSessionToken = async (tokenFromCtx?: string) => {
  if (tokenFromCtx) return tokenFromCtx;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

/**
 * Fetch Top News for a company from the backend.
 * Returns an array of { title, url?, source?, date?, summary? }
 */
const fetchTopNews = async (companyName: string, token?: string, n: number = 5) => {
  if (!companyName) return [];
  try {
    const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ai/top-news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ company_name: companyName, n }),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    // backend may return {articles:[...]} or an array directly
    const arr = Array.isArray(data?.articles) ? data.articles : (Array.isArray(data) ? data : []);
    return arr;
  } catch {
    return [];
  }
};

const Step7GenerateReport: React.FC<Step7GenerateReportProps> = ({ preparation }) => {
  const { session, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [html, setHtml] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);

  const buildTitleFromStep1 = (s1: any) => {
    const jt = s1?.job_title?.trim();
    const cn = s1?.company_name?.trim();
    return jt && cn ? `${jt} at ${cn}` : '';
  };

  const buildPreparationPayload = (p: any) => {
    const derived = buildTitleFromStep1(p?.step_1_data);
    const safeTitle =
      derived ||
      (p?.title && p.title.trim()) ||
      buildTitleFromStep1(p?.step_1_data) ||
      'Interview Preparation';
    const safeId = (typeof p?.id === 'string' && p.id.trim().length > 0) ? p.id : undefined;
    return {
      ...(safeId ? { id: safeId } : {}),
      title: safeTitle,
      job_url: p?.job_url || '',
      step_1_data: p?.step_1_data || {},
      step_2_data: p?.step_2_data || {},
      step_3_data: p?.step_3_data || {},
      step_4_data: p?.step_4_data || {},
      step_5_data: p?.step_5_data || {},
      step_6_data: p?.step_6_data || {},
    };
  };

  const loadHtmlPreview = async () => {
    if (!preparation) return;
    setPreviewLoading(true);
    try {
      const token = await ensureSessionToken(session?.access_token);

      // 1) Construire le payload
      const prepPayload = buildPreparationPayload(preparation);

      // 2) Récupérer et injecter les Top News si company_name dispo
      const companyName = preparation?.step_1_data?.company_name || '';
      const topNews = companyName ? await fetchTopNews(companyName, token, 5) : [];
      if (Array.isArray(topNews) && topNews.length) {
        prepPayload.step_3_data = {
          ...(prepPayload.step_3_data || {}),
          topNews, // le backend sait mapper topNews / top_news
        };
      }

      // 3) Appeler le rendu HTML
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pdf/html`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          preparationData: prepPayload,
          showGenerateButton: true,
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const htmlText = await resp.text();
      setHtml(htmlText);
    } catch (e) {
      console.error(e);
      setHtml('<div style="padding:24px;font-family:system-ui">Failed to load preview.</div>');
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    loadHtmlPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preparation?.id]);

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      if (ev?.data?.type === 'INTERVIEWACE_GENERATE_PDF') {
        handleGenerateReport();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preparation, session, profile]);

  const handleGenerateReport = async () => {
    if (!preparation) {
      alert('Preparation not loaded.');
      return;
    }
    const token = await ensureSessionToken(session?.access_token);
    if (!token) {
      alert('Authentication required to generate report.');
      return;
    }

    setLoading(true);
    setJobId(null);

    try {
      // 1) Construire le payload
      const prepPayload = buildPreparationPayload(preparation);

      // 2) Récupérer et injecter les Top News (même logique que preview)
      const companyName = preparation?.step_1_data?.company_name || '';
      const topNews = companyName ? await fetchTopNews(companyName, token, 5) : [];
      if (Array.isArray(topNews) && topNews.length) {
        prepPayload.step_3_data = {
          ...(prepPayload.step_3_data || {}),
          topNews,
        };
      }

      // 3) Génération PDF
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pdf/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          preparationData: prepPayload
        }),
      });

      if (!response.ok) {
        const raw = await response.text();
        let detail: any = null;
        try { detail = JSON.parse(raw); } catch {}
        const msg = (detail && (detail.message || detail.error)) || 'Validation failed';
        throw new Error(msg);
      }

      if (profile?.is_premium) {
        // premium → job queue (JSON)
        const data = await response.json();
        setJobId(data.jobId);
        alert('PDF generation started. You will receive an email when ready.');
      } else {
        // non premium → renvoi direct du PDF (blob)
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = (preparation.title || 'Interview Report').replace(/[^a-zA-Z0-9]/g, '-');
        a.href = url;
        a.download = `${safeName}.pdf`;
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Report Preview</h2>
      </div>

      {/* Action bar sticky – non imprimée */}
      <div className="sticky top-2 z-10 print:hidden mb-4">
        <div className="bg-white/70 backdrop-blur border rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="text-sm text-gray-600">
            Vérifie le rendu avant de générer le PDF.
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Download className="h-5 w-5 mr-2" />}
            {loading ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border overflow-hidden shadow-sm bg-white">
        {previewLoading ? (
          <div className="p-10 text-center text-gray-500">Loading preview…</div>
        ) : (
          <iframe
            title="InterviewAce Report Preview"
            srcDoc={html}
            className="w-full h-[75vh] border-0"
          />
        )}
      </div>

      {/* Premium job info */}
      {profile?.is_premium && jobId && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          <Crown className="w-5 h-5 inline mr-2" />
          <p className="font-medium">Report generation queued (Job ID: {jobId}).</p>
          <p className="text-sm">You will receive an email with your report shortly.</p>
        </div>
      )}
    </div>
  );
};

export default Step7GenerateReport;
