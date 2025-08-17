import React from 'react';
import { Building, ClipboardList, CheckSquare, User } from 'lucide-react';

interface MatchResult {
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
  // Conservés pour compat éventuelle avec le reste du parcours
  candidateProfile?: string;
  keyResponsibilities?: string[]; // (non utilisés ici)
  keySkills?: string[];          // (non utilisés ici)
  education?: string[];          // (non utilisés ici)
  experience?: string[];         // (non utilisés ici)
  cvText?: string;               // (non utilisé ici)
  matchingResults?: MatchingResults;

  // ✨ Nouveaux champs pour l’UX demandée
  requirementResponses?: string[];     // réponse de l’utilisateur pour chaque requirement
  responsibilityResponses?: string[];  // réponse de l’utilisateur pour chaque responsibility
}

interface Step4Props {
  data: Step4Data;
  onUpdate: (data: Step4Data) => void;
  jobData?: {
    keyRequirements?: string[];
    keyResponsibilities?: string[];
    // autres champs Step 1 inchangés
  };
}

const Step4Profile: React.FC<Step4Props> = ({ data, onUpdate, jobData }) => {
  const requirements = jobData?.keyRequirements ?? [];
  const responsibilities = jobData?.keyResponsibilities ?? [];

  // Score global — on l’utilise s’il est déjà calculé ailleurs
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

  // Helpers pour maj contrôlée et garder les index en phase avec les listes Step 1
  const updateRequirementResponse = (idx: number, value: string) => {
    const base = data.requirementResponses ?? [];
    const next = [...base];
    // s'assurer de la longueur
    if (requirements.length > next.length) {
      next.length = requirements.length;
      next.fill('', base.length);
    }
    next[idx] = value;
    onUpdate({ ...data, requirementResponses: next });
  };

  const updateResponsibilityResponse = (idx: number, value: string) => {
    const base = data.responsibilityResponses ?? [];
    const next = [...base];
    if (responsibilities.length > next.length) {
      next.length = responsibilities.length;
      next.fill('', base.length);
    }
    next[idx] = value;
    onUpdate({ ...data, responsibilityResponses: next });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Your Profile & Experience</h2>
        <p className="text-gray-600">Alignez vos atouts sur les attentes du poste.</p>
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
                  <div className="text-gray-800 text-sm">{req}</div>
                  <div className="mt-3">
                    <textarea
                      value={(data.requirementResponses?.[idx] ?? '')}
                      onChange={(e) => updateRequirementResponse(idx, e.target.value)}
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
                  <div className="text-gray-800 text-sm">{res}</div>
                  <div className="mt-3">
                    <textarea
                      value={(data.responsibilityResponses?.[idx] ?? '')}
                      onChange={(e) => updateResponsibilityResponse(idx, e.target.value)}
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

      {/* Petit rappel visuel de l’utilisateur (facultatif, conserve l’empreinte) */}
      <div className="flex items-center justify-center text-gray-600 text-sm">
        <User className="h-4 w-4 mr-2" />
        Renseignez les zones de texte pour lier clairement votre parcours aux attentes du poste.
      </div>
    </div>
  );
};

export default Step4Profile;
