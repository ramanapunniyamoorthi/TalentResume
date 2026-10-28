import React, { useState } from 'react';
import {
  X,
  Printer,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  Save,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CandidateResume, JobDescription, CandidateStatus } from '../types';
import { printCandidateReport } from '../utils/exportUtils';

interface CandidateDetailModalProps {
  candidate: CandidateResume | null;
  activeJob: JobDescription;
  isBlindMode: boolean;
  onClose: () => void;
  onUpdateReview: (candidateId: string, status: CandidateStatus, notes: string) => void;
  onDeleteCandidate: (candidateId: string) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  activeJob,
  isBlindMode,
  onClose,
  onUpdateReview,
  onDeleteCandidate
}) => {
  if (!candidate) return null;

  const [status, setStatus] = useState<CandidateStatus>(candidate.review.status);
  const [notes, setNotes] = useState(candidate.review.reviewerNotes || '');
  const [showRawText, setShowRawText] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    onUpdateReview(candidate.id, status, notes);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const displayName = isBlindMode
    ? `Candidate #${candidate.id.replace('cand-', '').toUpperCase()}`
    : candidate.name;

  const displayEmail = isBlindMode ? '••••••••@redacted.org' : candidate.email;
  const displayPhone = isBlindMode ? '•••-•••-••••' : candidate.phone;
  const score = candidate.matchResult.overallScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
                {isBlindMode && (
                  <span className="text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                    PII Redacted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span>{displayEmail}</span>
                <span aria-hidden="true">·</span>
                <span>{displayPhone}</span>
                <span aria-hidden="true">·</span>
                <span>{candidate.fileName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => printCandidateReport(candidate, activeJob, isBlindMode)}
              title="Print or Save PDF Dossier"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${displayName}?`)) {
                  onDeleteCandidate(candidate.id);
                  onClose();
                }
              }}
              title="Delete Resume"
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Primary Score Banner & Mathematical Transparency */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Composite Job Fit Score
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold text-slate-900 tabular-nums">
                    {score}
                  </span>
                  <span className="text-base text-slate-400 font-medium">/ 100</span>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-xs text-slate-500 block">Screened for role:</span>
                <span className="text-sm font-semibold text-slate-900">{activeJob.title}</span>
                <div className="text-xs text-slate-500 mt-0.5">
                  Min Req: {activeJob.requiredExperienceYears}+ yrs · {activeJob.requiredEducation}
                </div>
              </div>
            </div>

            {/* 4 Score Components */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-[11px] text-slate-500 block">TF-IDF Vector (40%)</span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {candidate.matchResult.breakdown.tfidfCosineScore}
                  <span className="text-xs font-normal text-slate-400">/100</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Cosine baseline</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Skills Overlap (35%)</span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {candidate.matchResult.breakdown.skillMatchScore}
                  <span className="text-xs font-normal text-slate-400">/100</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Mandatory & preferred</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Experience (15%)</span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {candidate.matchResult.breakdown.experienceScore}
                  <span className="text-xs font-normal text-slate-400">/100</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {candidate.detectedExperienceYears} yrs detected
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Education (10%)</span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {candidate.matchResult.breakdown.educationScore}
                  <span className="text-xs font-normal text-slate-400">/100</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate" title={candidate.detectedEducation}>
                  {candidate.detectedEducation}
                </span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700">Formula Disclosure:</span>{' '}
              <code className="text-slate-800 font-mono">
                Overall = (0.40 × TFIDF) + (0.35 × Skills) + (0.15 × Experience) + (0.10 × Education)
              </code>
              . Protected characteristics (age, gender, ethnicity) have zero weighting.
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Skill Overlap & Taxonomy Analysis
            </h3>

            {/* Matched Mandatory Skills */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-emerald-800 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Matched Required Skills ({candidate.matchResult.matchedRequiredSkills.length} / {activeJob.requiredSkills.length})</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {candidate.matchResult.matchedRequiredSkills.length > 0 ? (
                  candidate.matchResult.matchedRequiredSkills.map(skill => (
                    <span
                      key={skill}
                      className="text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No mandatory skills matched.</span>
                )}
              </div>
            </div>

            {/* Missing Mandatory Skills */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-red-800 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                  <span>Missing Required Skills ({candidate.matchResult.missingRequiredSkills.length})</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {candidate.matchResult.missingRequiredSkills.length > 0 ? (
                  candidate.matchResult.missingRequiredSkills.map(skill => (
                    <span
                      key={skill}
                      className="text-xs font-medium px-2.5 py-1 bg-red-50 text-red-800 border border-red-200 rounded-md"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-700 font-medium">
                    ✓ All mandatory skills fulfilled!
                  </span>
                )}
              </div>
            </div>

            {/* Preferred & Additional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1.5">
                  Preferred Skills Fulfilled
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.matchResult.matchedPreferredSkills.length > 0 ? (
                    candidate.matchResult.matchedPreferredSkills.map(skill => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None detected</span>
                  )}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1.5">
                  Additional Skills in Resume
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.matchResult.additionalSkills.length > 0 ? (
                    candidate.matchResult.additionalSkills.map(skill => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No additional recognized skills</span>
                  )}
                </div>
              </div>
            </div>

            {/* Top TF-IDF key terms */}
            {candidate.matchResult.topKeyTerms && candidate.matchResult.topKeyTerms.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-medium text-slate-500 mb-1.5">
                  Strongest Vocabulary Overlap Terms (Scikit-Learn TF-IDF Weights)
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {candidate.matchResult.topKeyTerms.map(item => (
                    <span key={item.term} className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {item.term} <span className="text-slate-400">({item.tfidfWeight})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Human Review & Pipeline Decision */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                <span>Human-In-The-Loop Review & Audit</span>
              </h3>
              {saveSuccess && (
                <span className="text-xs text-emerald-700 font-medium">✓ Review saved</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pipeline Stage
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CandidateStatus)}
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview">Interview</option>
                  <option value="Offered">Offered</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reviewer
                </label>
                <input
                  type="text"
                  disabled
                  value={candidate.review.reviewedBy || 'Current HR Reviewer'}
                  className="w-full text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Evaluation Notes & Audit Rationale
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Enter specific hiring rationale, interview scheduling notes, or skill assessment comments..."
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Review Decision</span>
              </button>
            </div>
          </div>

          {/* Raw Text Accordion */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="w-full px-4 py-3 bg-slate-50 text-left text-xs font-medium text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>View Raw Parsed Resume Text ({candidate.fileType.toUpperCase()})</span>
              </span>
              {showRawText ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showRawText && (
              <div className="p-4 bg-slate-900 text-slate-200 text-xs font-mono max-h-60 overflow-y-auto whitespace-pre-wrap selection:bg-slate-700">
                {candidate.rawText}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
