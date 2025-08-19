import React, { useMemo, useState } from 'react';
import { Building, ClipboardList, CheckSquare, User, Flame, Circle, RefreshCw } from 'lucide-react';
import { aiService, type MatchingResultsFront } from '@/services/aiService';

interface MatchResult {
  targetType: 'requirement' | 'responsibility';
  targetIndex: number;
  targetText: string;

  skill: string;
  grade: 'High' | 'Moderate' | 'Low';
  score: number;
  reasoning: string;
}

interface MatchingResults {
  overallScore: number;
  matches: MatchResult[];
  distribution: {
    high: number;
    moderate: number;
    low: number;
  };
}

interface Step4Data {
  // Conservés pour compat éventuelle
  candidateProfile?: string;
  keyResponsibilities?: string[]; // (non utilisés ici)
  keySkills?: string[];
  education?: string[];
  experience?: string[];
  cvText?: string;
  matchingResults?: MatchingResults;

  // ✨ Nouveaux champs UX
  requirementResponses?: string[];
  responsibilityResponses?: string[];
}

interface Step4Props {
  data: Step4Data;
  onUpdate: (data: Step4Data) => void;
  jobData?: {
    keyRequirements?: string[];
    keyResponsibilities?: string[];
  };
}

const Step4Profile: React.FC<Step4Props> = ({ data, onUpdate, jobData }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const requirements = jobData?.keyRequirements ?? [];
  const responsibilities = jobData?.keyResponsibilities ?? [];

  // score global (si déjà présent)
  const score = typeof data.matchingResults?.overallScore === 'number'
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

  const getMatchIcon = (score: number) => {
    if (score >= 90) return <Flame className="w-5 h-5 text-red-500" title="Excellent match" />;
    if (score >= 75) return <Circle className="w-5 h-5 text-green-500" title="Good match" />;
    if (score >= 50) return <Circle className="w-5 h-5 text-orange-500" title="Moderate match" />;
    return <Circle className="w-5 h-5 text-red-500" title="Weak match" />;
  };

  // Bouton activable si on a de quoi matcher
  const canGenerate = useMemo(() => {
    const hasJob = (requirements.length + responsibilities.length) > 0;
    const hasCV = (data.skills?.length ?? 0) + (data.education?.length ?? 0) + (data.experience?.length ?? 0) > 0;
    return hasJob && hasCV && !loading;
  }, [requirements.length, responsibilities.length, data.skills, data.education, data.experience, loading]);

  const handleGenerate = async () => {
    setErr(null);
    setLoading(true);
    try {
      const payload = {
        requirements,
        responsibilities,
        education: data.education ?? [],
        experience: data.experience ?? [],
        skills: data.keySkills ?? data['skills' as any] ?? [], // fallback if you later store skills elsewhere
      };

      const res: MatchingResultsFront = await aiService.matchProfile(payload);
      const normalized: MatchingResults = {
        overallScore: res.overallScore ?? 0,
        matches: Array.isArray(res.matches) ? res.matches : [],
        distribution: res.distribution ?? { high: 0, moderate: 0, low: 0 },
      };

      onUpdate({ ...data, matchingResults: normalized });
    } catch (e: any) {
      setErr(e?.message || 'Failed to generate match results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="text-left">
          <h2 className="text-2xl font-bold text-gray-900">Your Profile & Experience</h2>
          <p className="text-gray-600">Alignez vos atouts sur les attentes du poste.</p>
        </div>

        {/* Toolbar */}
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
            title={!canGenerate ? 'Ajoutez les données CV et poste pour lancer le matching' : 'Générer le matching IA'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Global Scoring */}
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

      {/* Deux colonnes : Requirements / Responsibilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colonne gauche : Key Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-6 flex items-center">
            <Building className="h-6 w-6 mr-2" />
            Key Requirements
          </h3>

          {requirements.length === 0 ? (
            <p className="text-blue-600 text-sm italic">
              Complete Step 1 Job Analysis to see requirements
            </p>
          ) : (
            <div className="space-y-4">
              {requirements.map((req, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-gray-800 text-sm">{req}</div>
                    {/* (Option future) si tu ajoutes target côté backend, mets l’icône ici */}
                  </div>
                  <div className="mt-3">
                    <textarea
                      value={(data.requirementResponses?.[idx] ?? '')}
                      onChange={(e) => {
                        const base = data.requirementResponses ?? [];
                        const next = [...base];
                        if (requirements.length > next.length) {
                          next.length = requirements.length;
                          next.fill('', base.length);
                        }
                        next[idx] = e.target.value;
                        onUpdate({ ...data, requirementResponses: next });
                      }}
                      placeholder="Expliquez brièvement en quoi votre éducation ou expérience répond à cette exigence…"
                      rows={3}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite : Key Responsibilities */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-6 flex items-center">
            <ClipboardList className="h-6 w-6 mr-2" />
            Key Responsibilities
          </h3>

          {responsibilities.length === 0 ? (
            <p className="text-blue-600 text-sm italic">
              Complete Step 1 Job Analysis to see responsibilities
            </p>
          ) : (
            <div className="space-y-4">
              {responsibilities.map((res, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-gray-800 text-sm">{res}</div>
                    {/* (Option future) si tu ajoutes target côté backend, mets l’icône ici */}
                  </div>
                  <div className="mt-3">
                    <textarea
                      value={(data.responsibilityResponses?.[idx] ?? '')}
                      onChange={(e) => {
                        const base = data.responsibilityResponses ?? [];
                        const next = [...base];
                        if (responsibilities.length > next.length) {
                          next.length = responsibilities.length;
                          next.fill('', base.length);
                        }
                        next[idx] = e.target.value;
                        onUpdate({ ...data, responsibilityResponses: next });
                      }}
                      placeholder="Donnez un exemple ou un résultat mesurable qui prouve que vous pouvez assumer cette responsabilité…"
                      rows={3}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
                        : m.grade === 'Moderate' ? 'text-orange-600'
                        : 'text-red-600'
                      }>
                        {m.grade}
                      </span>
                    </div>
                  </div>
                  {m.reasoning && (
                    <p className="mt-1 text-sm text-gray-700">{m.reasoning}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hint si Generate est désactivé */}
      {!canGenerate && (
        <div className="text-xs text-gray-500">
          Astuce : assurez-vous d’avoir des <span className="font-medium">requirements/responsibilities</span> (Step 1)
          et des <span className="font-medium">skills/education/experience</span> (CV) pour activer le bouton Generate.
        </div>
      )}
    </div>
  );
};

export default Step4Profile;
