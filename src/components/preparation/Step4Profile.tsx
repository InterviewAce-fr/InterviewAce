import React, { useMemo, useState } from 'react';
import { Building, ClipboardList, CheckSquare, RefreshCw, Flame, Circle } from 'lucide-react';
import { aiService, type MatchingResultsFront } from '@/lib/aiService';
import { AutoGrowTextarea, SectionCard } from '@/components/common';

type MatchResult = {
  targetType: 'requirement' | 'responsibility';
  targetIndex: number;
  targetText: string;
  skill: string;
  grade: 'High' | 'Moderate' | 'Low';
  score: number;
  reasoning: string;
};

type MatchingResults = {
  overallScore: number;
  matches: MatchResult[];
  distribution: { high: number; moderate: number; low: number };
};

type Step4Data = {
  candidateProfile?: string;
  keyResponsibilities?: string[];
  keySkills?: string[];
  education?: string[] | any[];
  experience?: string[] | any[];
  cvText?: string;
  matchingResults?: MatchingResults;
  requirementResponses?: string[];
  responsibilityResponses?: string[];
};

type Step4Props = {
  data: Step4Data;
  onUpdate: (data: Step4Data) => void;
  jobData?: {
    keyRequirements?: string[];
    keyResponsibilities?: string[];
    required_profile?: string[];
    responsibilities?: string[];
  };
  cvData?: {
    skills?: string[] | any[];
    education?: string[] | any[];
    experience?: string[] | any[];
  };
};

// ---------------- helpers ----------------

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
          const bits = [degree, school, period ? `(${period})` : ''].filter(Boolean);
          return bits.join(' ');
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

function gradeBadge(grade?: 'High' | 'Moderate' | 'Low', score?: number) {
  const s = typeof score === 'number' ? score : -1;
  let label = 'Low';
  let cls = 'bg-red-100 text-red-700 border-red-200';
  if (s >= 90) { label = 'Perfect'; cls = 'bg-emerald-100 text-emerald-700 border-emerald-200'; }
  else if (s >= 75) { label = 'High'; cls = 'bg-green-100 text-green-700 border-green-200'; }
  else if (s >= 50) { label = 'Moderate'; cls = 'bg-amber-100 text-amber-700 border-amber-200'; }

  if (s < 0 && grade) {
    if (grade === 'High') { label = 'High'; cls = 'bg-green-100 text-green-700 border-green-200'; }
    if (grade === 'Moderate') { label = 'Moderate'; cls = 'bg-amber-100 text-amber-700 border-amber-200'; }
    if (grade === 'Low') { label = 'Low'; cls = 'bg-red-100 text-red-700 border-red-200'; }
  }
  return { label, cls };
}

function formatAnswer(m: MatchResult | undefined): string {
  if (!m) return 'No direct match can be established.';
  const parts = [];
  if (m.skill) parts.push(`Skill: ${m.skill}.`);
  if (m.reasoning) parts.push(m.reasoning);
  const text = parts.join(' ');
  return text || 'No direct match can be established.';
}

// -------------- component ----------------

const Step4Profile: React.FC<Step4Props> = ({ data, onUpdate, jobData, cvData }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // job
  const requirements = jobData?.keyRequirements ?? jobData?.required_profile ?? [];
  const responsibilities = jobData?.keyResponsibilities ?? jobData?.responsibilities ?? [];

  // cv
  const cvSkills = toStringArray(data.keySkills ?? (data as any).skills ?? cvData?.skills, 'skills');
  const cvEducation = toStringArray(data.education ?? cvData?.education, 'edu');
  const cvExperience = toStringArray(data.experience ?? cvData?.experience, 'exp');

  // score global
  const score =
    typeof data.matchingResults?.overallScore === 'number'
      ? Math.round(data.matchingResults.overallScore)
      : null;

  const getScoreColor = (s: number | null) => {
    if (s === null) return 'text-gray-600 border-gray-300';
    if (s < 50) return 'text-red-600 border-red-300';
    if (s < 75) return 'text-yellow-600 border-yellow-300';
    return 'text-green-600 border-green-300';
  };
  const getScoreBg = (s: number | null) => {
    if (s === null) return 'bg-gray-50';
    if (s < 50) return 'bg-red-50';
    if (s < 75) return 'bg-yellow-50';
    return 'bg-green-50';
  };
  const getMatchIcon = (v: number) => {
    if (v >= 90) return <Flame className="w-5 h-5" title="Excellent match" />;
    if (v >= 75) return <Circle className="w-5 h-5" title="Good match" />;
    if (v >= 50) return <Circle className="w-5 h-5" title="Moderate match" />;
    return <Circle className="w-5 h-5" title="Weak match" />;
  };

  const canGenerate = useMemo(() => {
    const hasJob = (requirements.length + responsibilities.length) > 0;
    const hasCV = cvSkills.length + cvEducation.length + cvExperience.length > 0;
    return hasJob && hasCV && !loading;
  }, [
    requirements.length,
    responsibilities.length,
    cvSkills.length,
    cvEducation.length,
    cvExperience.length,
    loading
  ]);

  const handleGenerate = async () => {
    setErr(null);
    setLoading(true);
    try {
      const payload = {
        requirements,
        responsibilities,
        education: cvEducation,
        experience: cvExperience,
        skills: cvSkills,
      };

      const res: MatchingResultsFront = await aiService.matchProfile(payload);

      const normalized: MatchingResults = {
        overallScore: res.overallScore ?? 0,
        matches: Array.isArray(res.matches) ? res.matches : [],
        distribution: res.distribution ?? { high: 0, moderate: 0, low: 0 },
      };

      const bestReqMatch: Record<number, MatchResult | undefined> = {};
      const bestResMatch: Record<number, MatchResult | undefined> = {};

      for (const m of normalized.matches) {
        if (m.targetType === 'requirement') {
          const cur = bestReqMatch[m.targetIndex];
          if (!cur || (m.score ?? 0) > (cur.score ?? 0)) bestReqMatch[m.targetIndex] = m;
        } else {
          const cur = bestResMatch[m.targetIndex];
          if (!cur || (m.score ?? 0) > (cur.score ?? 0)) bestResMatch[m.targetIndex] = m;
        }
      }

      const nextRequirementResponses = requirements.map((_, i) => formatAnswer(bestReqMatch[i]));
      const nextResponsibilityResponses = responsibilities.map((_, i) => formatAnswer(bestResMatch[i]));

      onUpdate({
        ...data,
        matchingResults: normalized,
        requirementResponses: nextRequirementResponses,
        responsibilityResponses: nextResponsibilityResponses,
      });
    } catch (e: any) {
      let msg = 'Failed to generate match results';
      if (e?.response?.data) {
        const d = e.response.data;
        if (Array.isArray(d)) msg = d.map((x: any) => x.message || JSON.stringify(x)).join(' | ');
        else if (typeof d === 'object' && d.error) msg = String(d.error);
      } else if (e?.message) {
        msg = e.message;
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------- UI --------
  return (
    <div className="space-y-8">
      {/* Header + bouton Generate */}
      <div className="flex items-start justify-between gap-4">
        <div className="text-left">
          <h2 className="text-2xl font-bold text-gray-900">Your Profile & Experience</h2>
          <p className="text-gray-600">Alignez vos atouts sur les attentes du poste.</p>
        </div>

        <div className="flex items-center gap-2">
          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
              {err}
            </div>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition
              ${canGenerate ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                             : 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'}`}
            title={!canGenerate ? 'Add resume and job info to start matching' : 'Matching'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Score global */}
      <div className="flex justify-center">
        <div
          className={`flex items-center justify-center w-28 h-28 rounded-full border-4 ${getScoreColor(score)} ${getScoreBg(score)}`}
          aria-label="Global Match Score"
          title="Global Match Score"
        >
          <div className="text-center">
            <div className={`text-3xl font-extrabold leading-none ${score === null ? 'text-gray-600' : ''}`}>
              {score === null ? '—' : `${score}`}
            </div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-600">/ 100</div>
          </div>
        </div>
      </div>

      {/* Deux colonnes propre + moderne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr min-h-0">
        {/* Requirements */}
        <SectionCard
          title={<span className="inline-flex items-center gap-2 text-gray-900"><Building className="h-5 w-5" />Key Requirements</span>}
          className="border-t-4 border-t-blue-500"
        >
          {requirements.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Complete Step 1 Job Analysis to see requirements</p>
          ) : (
            <ul className="space-y-4">
              {requirements.map((req, idx) => {
                const m = data.matchingResults?.matches.find(
                  (x) => x.targetType === 'requirement' && x.targetIndex === idx
                );
                const badge = gradeBadge(m?.grade, m?.score);
                return (
                  <li key={idx} className="border rounded-lg p-4 relative">
                    {/* badge score */}
                    <div
                      className={`absolute top-3 right-3 text-xs border px-2 py-0.5 rounded-full ${badge.cls}`}
                      title={m ? `${badge.label} • ${m.score ?? '-'} / 100` : 'No match'}
                    >
                      {m ? `${badge.label}` : 'No match'}
                    </div>

                    <div className="text-gray-900 text-sm font-medium pr-20">{req}</div>
                    <div className="mt-2">
                      <AutoGrowTextarea
                        value={data.requirementResponses?.[idx] ?? ''}
                        onChange={(e) => {
                          const base = data.requirementResponses ?? Array(requirements.length).fill('');
                          const next = [...base];
                          if (requirements.length > next.length) {
                            next.length = requirements.length;
                            next.fill('', base.length);
                          }
                          next[idx] = e.target.value;
                          onUpdate({ ...data, requirementResponses: next });
                        }}
                        placeholder="Explain briefly how your education/experience fits this requirement…"
                        className="border border-gray-200 rounded px-2"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {/* Responsibilities */}
        <SectionCard
          title={<span className="inline-flex items-center gap-2 text-gray-900"><ClipboardList className="h-5 w-5" />Key Responsibilities</span>}
          className="border-t-4 border-t-emerald-500"
        >
          {responsibilities.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Complete Step 1 Job Analysis to see responsibilities</p>
          ) : (
            <ul className="space-y-4">
              {responsibilities.map((res, idx) => {
                const m = data.matchingResults?.matches.find(
                  (x) => x.targetType === 'responsibility' && x.targetIndex === idx
                );
                const badge = gradeBadge(m?.grade, m?.score);
                return (
                  <li key={idx} className="border rounded-lg p-4 relative">
                    <div
                      className={`absolute top-3 right-3 text-xs border px-2 py-0.5 rounded-full ${badge.cls}`}
                      title={m ? `${badge.label} • ${m.score ?? '-'} / 100` : 'No match'}
                    >
                      {m ? `${badge.label}` : 'No match'}
                    </div>

                    <div className="text-gray-900 text-sm font-medium pr-20">{res}</div>
                    <div className="mt-2">
                      <AutoGrowTextarea
                        value={data.responsibilityResponses?.[idx] ?? ''}
                        onChange={(e) => {
                          const base = data.responsibilityResponses ?? Array(responsibilities.length).fill('');
                          const next = [...base];
                          if (responsibilities.length > next.length) {
                            next.length = responsibilities.length;
                            next.fill('', base.length);
                          }
                          next[idx] = e.target.value;
                          onUpdate({ ...data, responsibilityResponses: next });
                        }}
                        placeholder="Give a measurable example proving you can own this responsibility…"
                        className="border border-gray-200 rounded px-2"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* AI Match Results */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-gray-700" />
            AI Match Results
          </h3>
          {data.matchingResults && (
            <div className="text-sm text-gray-600">
              High: {data.matchingResults.distribution.high} · Moderate: {data.matchingResults.distribution.moderate} · Low: {data.matchingResults.distribution.low}
            </div>
          )}
        </div>

        {!data.matchingResults ? (
          <div className="px-6 py-6 text-sm text-gray-600">
            Click <span className="font-medium">Generate</span> to compute your match against the job requirements and responsibilities.
          </div>
        ) : data.matchingResults.matches.length === 0 ? (
          <div className="px-6 py-6 text-sm text-gray-600">No matches returned.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.matchingResults.matches.map((m, i) => (
              <li key={i} className="px-6 py-4 flex items-start gap-3">
                <div className="pt-0.5">{getMatchIcon(m.score)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">{m.skill || '—'}</div>
                    <div className="text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-semibold">{m.score}</span><span className="text-gray-500">/100</span>
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className={
                        m.grade === 'High' ? 'text-green-600'
                        : m.grade === 'Moderate' ? 'text-amber-600'
                        : 'text-red-600'
                      }>
                        {m.grade}
                      </span>
                    </div>
                  </div>
                  {m.reasoning && <p className="mt-1 text-sm text-gray-700">{m.reasoning}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!canGenerate && (
        <div className="text-xs text-gray-500">
          Astuce : assurez‑vous d’avoir des <span className="font-medium">requirements/responsibilities</span> (Step 1)
          et des <span className="font-medium">skills/education/experience</span> (CV) pour activer le bouton Generate.
        </div>
      )}
    </div>
  );
};

export default Step4Profile;
