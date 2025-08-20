import React, { useState, useMemo } from 'react';
import { Zap, Loader2, MessageCircle, Building, User, Target } from 'lucide-react';
import { aiService } from '../../lib/aiService';
import { toast } from '../ui/Toast';

interface Step5Data {
  whyCompany?: string;
  whyRole?: string;
  whyYou?: string;
}

interface Step5Props {
  data: Step5Data;
  onUpdate: (data: Step5Data) => void;
  cvData?: any;
  jobData?: any;
  swotData?: any;
  matchingResults?: {
    overallScore?: number;
    matches?: Array<{
      targetType: 'requirement' | 'responsibility';
      targetIndex: number;
      targetText: string;
      skill: string;
      grade: 'High' | 'Moderate' | 'Low';
      score: number;
      reasoning: string;
    }>;
  };
  bmcData?: any; // ⬅️ Step 2
}

// --- helpers ----------------------------------------------------

function toStringArray(input: any, kind: 'skills' | 'edu' | 'exp'): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item: any) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        if (kind === 'edu') {
          const degree = item.degree || item.title || item.program || '';
          const school = item.school || item.university || item.institution || '';
          const period =
            [item.start, item.end].filter(Boolean).join('–') ||
            [item.start_date, item.end_date].filter(Boolean).join('–');
          return [degree, school, period ? `(${period})` : ''].filter(Boolean).join(' ');
        }
        if (kind === 'exp') {
          const title = item.title || item.role || '';
          const company = item.company || item.employer || '';
          const period =
            [item.start, item.end].filter(Boolean).join('–') ||
            [item.start_date, item.end_date].filter(Boolean).join('–');
          const ach = Array.isArray(item.achievements)
            ? item.achievements.slice(0, 3).join('; ')
            : (item.summary || '');
          const header = title && company ? `${title} @ ${company}` : (title || company);
          return [header, period ? `(${period})` : '', ach].filter(Boolean).join(' ');
        }
        if (kind === 'skills') {
          return item.name || item.skill || item.label || JSON.stringify(item);
        }
      }
      return String(item);
    })
    .map((s) => (s || '').toString().trim())
    .filter(Boolean);
}

// prend les meilleurs matches (score desc), en gardant un mix req/responsibilities
function selectTopMatches(matches: any[] = [], limit = 8) {
  const sorted = [...matches].sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
  // On essaie d'avoir 50/50 si possible
  const req = sorted.filter(m => m.targetType === 'requirement').slice(0, Math.ceil(limit/2));
  const res = sorted.filter(m => m.targetType === 'responsibility').slice(0, Math.floor(limit/2));
  const merged = [...req, ...res];
  // si pas assez, on complète
  if (merged.length < limit) {
    const remaining = sorted.filter(m => !merged.includes(m)).slice(0, limit - merged.length);
    return [...merged, ...remaining];
  }
  return merged.slice(0, limit);
}

// ---------------------------------------------------------------

const Step5WhyQuestions: React.FC<Step5Props> = ({
  data,
  onUpdate,
  cvData,
  jobData,
  swotData,
  matchingResults,
  bmcData
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const cv = useMemo(() => ({
    skills: toStringArray(cvData?.skills, 'skills'),
    education: toStringArray(cvData?.education, 'edu'),
    experience: toStringArray(cvData?.experience, 'exp'),
  }), [cvData]);

  const job = useMemo(() => {
    const req = jobData?.keyRequirements ?? jobData?.required_profile ?? [];
    const resp = jobData?.keyResponsibilities ?? jobData?.responsibilities ?? [];
    return {
      ...jobData,
      requirements: Array.isArray(req) ? req : [],
      responsibilities: Array.isArray(resp) ? resp : [],
    };
  }, [jobData]);

  const swot = useMemo(() => ({
    strengths: Array.isArray(swotData?.strengths) ? swotData.strengths : [],
    weaknesses: Array.isArray(swotData?.weaknesses) ? swotData.weaknesses : [],
    opportunities: Array.isArray(swotData?.opportunities) ? swotData.opportunities : [],
    threats: Array.isArray(swotData?.threats) ? swotData.threats : [],
  }), [swotData]);

  const bmc = useMemo(() => {
    const x = bmcData || {};
    const arr = (a: any) => (Array.isArray(a) ? a.filter(Boolean) : []);
    return {
      valuePropositions: arr(x.valuePropositions),
      customerSegments: arr(x.customerSegments),
      keyActivities: arr(x.keyActivities),
      keyResources: arr(x.keyResources),
      channels: arr(x.channels),
    };
  }, [bmcData]);

  const topMatches = useMemo(
    () => selectTopMatches(matchingResults?.matches || [], 8),
    [matchingResults]
  );

  const handleChange = (field: keyof Step5Data, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  const generateAISuggestions = async () => {
    if (!cvData || !jobData) {
      return toast.error('Please complete CV analysis in Step 4 and job analysis in Step 1 first.');
    }

    setIsGenerating(true);

    try {
      // On enrichit le 4e param avec bmc pour donner du contexte supplémentaire au backend.
      const enrichedSwot = { ...swot, bmc, matches: topMatches };

      const suggestions = await aiService.generateWhySuggestions(
        cv,          // ⬅️ normalisé
        job,         // ⬅️ requirements/responsibilities garantis
        { matches: topMatches, overallScore: matchingResults?.overallScore }, // ⬅️ condensé utile
        enrichedSwot // ⬅️ swot + bmc + matches (pour le contexte Why company/role/you)
      );

      // sécurité: fallback strings si backend renvoie vide
      const next = {
        whyCompany:
          suggestions?.whyCompany ||
          (swot.opportunities[0]
            ? `I’m excited by your opportunity around: ${swot.opportunities[0]} — it aligns with my background and the value I can bring.`
            : 'I’m genuinely excited by your mission and trajectory, and I see a strong alignment with my background.'),
        whyRole:
          suggestions?.whyRole ||
          (topMatches[0]
            ? `This role lets me continue doing ${topMatches[0].skill.toLowerCase()} and contribute directly to ${topMatches[0].targetText}.`
            : 'This role matches my strengths and the problems I enjoy solving.'),
        whyYou:
          suggestions?.whyYou ||
          (cv.skills?.length
            ? `You should hire me for my strengths in ${cv.skills.slice(0, 3).join(', ')} and my track record of delivering measurable results.`
            : 'You should hire me because I bring strong execution, adaptability, and a focus on measurable impact.'),
      };

      onUpdate(next);
      toast.success('AI suggestions generated successfully!');
    } catch (e: any) {
      let msg = 'Failed to generate suggestions';
      if (e?.response?.data) {
        const d = e.response.data;
        if (Array.isArray(d)) msg = d.map((x: any) => x.message || JSON.stringify(x)).join(' | ');
        else if (typeof d === 'object' && d.error) msg = String(d.error);
      } else if (e?.message) {
        msg = e.message;
      }
      console.error('Suggestion generation error:', e);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const questions = [
    {
      id: 'whyYou' as const,
      title: 'Why should we hire you?',
      icon: User,
      placeholder:
        'Focus on your unique value proposition, key achievements, and how your skills directly address their needs...',
      description:
        'Highlight your strongest matches and unique qualifications that make you the ideal candidate.',
    },
    {
      id: 'whyCompany' as const,
      title: 'Why do you want to work for this company?',
      icon: Building,
      placeholder:
        "Research the company's mission, values, recent achievements, and explain how they align with your career goals...",
      description:
        "Use their mission, product momentum, and SWOT opportunities to show genuine interest and alignment.",
    },
    {
      id: 'whyRole' as const,
      title: 'Why are you interested in this role?',
      icon: Target,
      placeholder:
        'Connect the role’s responsibilities to your career aspirations and explain how it fits your professional development...',
      description:
        'Leverage your top matches (continue doing X) and growth areas (take a part in Y) to show fit + motivation.',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Questions</h2>
        <p className="text-gray-600">
          Prepare compelling answers to the most fundamental interview questions.
        </p>

        {/* AI Suggestion Button */}
        <div className="mt-4">
          <button
            onClick={generateAISuggestions}
            disabled={isGenerating || !cvData || !jobData}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
            <span>{isGenerating ? 'Generating AI Suggestions...' : 'Generate AI Suggestions'}</span>
          </button>
          <p className="text-sm text-gray-600 mt-2">
            AI will analyze your profile, job data, company strategy and past matches to suggest personalized answers.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {questions.map((q) => {
          const Icon = q.icon;
          return (
            <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg mr-3">
                  <Icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{q.title}</h3>
                  <p className="text-sm text-gray-600">{q.description}</p>
                </div>
              </div>

              <textarea
                value={data[q.id] || ''}
                onChange={(e) => handleChange(q.id, e.target.value)}
                placeholder={q.placeholder}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />

              <div className="mt-3 text-sm text-gray-500">
                <MessageCircle className="inline h-4 w-4 mr-1" />
                Tip: Keep your answer concise (2–3 minutes when spoken) and include specific examples.
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Interview Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Use the STAR method (Situation, Task, Action, Result)</li>
          <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Quantify achievements with numbers where possible</li>
          <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Reference the company’s mission and current opportunities</li>
          <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Practice answers out loud to improve delivery</li>
        </ul>
      </div>
    </div>
  );
};

export default Step5WhyQuestions;
