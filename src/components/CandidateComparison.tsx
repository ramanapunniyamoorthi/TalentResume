import React from 'react';
import { Check, X, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { CandidateResume, JobDescription } from '../types';

interface CandidateComparisonProps {
  candidates: CandidateResume[];
  allCandidates: CandidateResume[];
  activeJob: JobDescription;
  isBlindMode: boolean;
  onRemoveFromCompare: (id: string) => void;
  onSelectCandidate: (candidate: CandidateResume) => void;
  onClearComparison: () => void;
}

export const CandidateComparison: React.FC<CandidateComparisonProps> = ({
  candidates,
  allCandidates,
  activeJob,
  isBlindMode,
  onRemoveFromCompare,
  onSelectCandidate,
  onClearComparison
}) => {
  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-500">
          <UserCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">No Candidates Selected for Comparison</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Check the box next to any candidate in the Candidates table to compare their skill matrices and TF-IDF scores side-by-side.
        </p>
        <div className="flex justify-center gap-2">
          {allCandidates.slice(0, 3).map((c, idx) => (
            <button
              key={c.id}
              onClick={() => onSelectCandidate(c)}
              className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700"
            >
              + {isBlindMode ? `Candidate #${idx + 101}` : c.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Side-by-Side Candidate Matrix</h2>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {candidates.length} / 4 candidates
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluating candidates against requirement baseline: <span className="font-medium text-slate-800">{activeJob.title}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearComparison}
            className="text-xs px-3 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">
                Evaluation Metric
              </th>
              {candidates.map((c, idx) => {
                const displayName = isBlindMode ? `Candidate #${String(idx + 101).padStart(4, '0')}` : c.name;
                return (
                  <th key={c.id} className="p-4 text-xs font-semibold text-slate-900 border-l border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="truncate max-w-[140px] font-bold" title={displayName}>
                        {displayName}
                      </span>
                      <button
                        onClick={() => onRemoveFromCompare(c.id)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                        title="Remove from matrix"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                      {c.review.status}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {/* Overall Score */}
            <tr className="bg-slate-50/30">
              <td className="p-4 font-semibold text-slate-900">
                Overall Match Score (0–100)
              </td>
              {candidates.map(c => (
                <td key={c.id} className="p-4 border-l border-slate-200">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      {c.matchResult.overallScore}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full ${
                        c.matchResult.overallScore >= 75
                          ? 'bg-emerald-600'
                          : c.matchResult.overallScore >= 50
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${c.matchResult.overallScore}%` }}
                    />
                  </div>
                </td>
              ))}
            </tr>

            {/* TF-IDF Baseline */}
            <tr>
              <td className="p-4 text-slate-600">
                TF-IDF Cosine Baseline (40%)
                <span className="block text-[10px] text-slate-400">Vocabulary projection</span>
              </td>
              {candidates.map(c => (
                <td key={c.id} className="p-4 border-l border-slate-200 font-mono font-medium text-slate-800">
                  {c.matchResult.breakdown.tfidfCosineScore} / 100
                </td>
              ))}
            </tr>

            {/* Skill Score */}
            <tr>
              <td className="p-4 text-slate-600">
                Skill Match Score (35%)
                <span className="block text-[10px] text-slate-400">Mandatory & preferred</span>
              </td>
              {candidates.map(c => (
                <td key={c.id} className="p-4 border-l border-slate-200 font-mono font-medium text-slate-800">
                  {c.matchResult.breakdown.skillMatchScore} / 100
                </td>
              ))}
            </tr>

            {/* Experience */}
            <tr>
              <td className="p-4 text-slate-600">
                Experience Duration
                <span className="block text-[10px] text-slate-400">Target: {activeJob.requiredExperienceYears}+ yrs</span>
              </td>
              {candidates.map(c => {
                const meets = c.detectedExperienceYears >= activeJob.requiredExperienceYears;
                return (
                  <td key={c.id} className="p-4 border-l border-slate-200">
                    <span className={`font-semibold ${meets ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {c.detectedExperienceYears} years
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {meets ? '✓ Meets criteria' : '⚠ Below target'}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Education */}
            <tr>
              <td className="p-4 text-slate-600">
                Education Level
                <span className="block text-[10px] text-slate-400">Target: {activeJob.requiredEducation}</span>
              </td>
              {candidates.map(c => (
                <td key={c.id} className="p-4 border-l border-slate-200 text-slate-800">
                  {c.detectedEducation}
                </td>
              ))}
            </tr>

            {/* Mandatory Skills Matrix */}
            <tr className="bg-slate-50/50">
              <td colSpan={candidates.length + 1} className="px-4 py-2 text-xs font-semibold text-slate-700">
                Mandatory Skill Verification Check
              </td>
            </tr>

            {activeJob.requiredSkills.map(skill => (
              <tr key={skill}>
                <td className="p-4 text-slate-700 font-medium">
                  {skill}
                </td>
                {candidates.map(c => {
                  const hasSkill = c.matchResult.matchedRequiredSkills.includes(skill);
                  return (
                    <td key={c.id} className="p-4 border-l border-slate-200">
                      {hasSkill ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Matched</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <X className="w-4 h-4 text-slate-300" />
                          <span>Missing</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Action Row */}
            <tr className="bg-slate-50/70">
              <td className="p-4 text-xs text-slate-500 font-medium">
                Detailed Dossier
              </td>
              {candidates.map(c => (
                <td key={c.id} className="p-4 border-l border-slate-200">
                  <button
                    onClick={() => onSelectCandidate(c)}
                    className="flex items-center gap-1 text-xs font-medium text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    <span>View Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
