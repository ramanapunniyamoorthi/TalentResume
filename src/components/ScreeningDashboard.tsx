import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Briefcase,
  CheckCircle,
  Clock,
  Eye,
  Trash2,
  ChevronDown,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { CandidateResume, JobDescription, CandidateStatus } from '../types';
import { exportCandidatesToCsv } from '../utils/exportUtils';

interface ScreeningDashboardProps {
  candidates: CandidateResume[];
  jobs: JobDescription[];
  activeJob: JobDescription;
  setActiveJob: (job: JobDescription) => void;
  isBlindMode: boolean;
  onOpenUpload: () => void;
  onOpenNewJob: () => void;
  onSelectCandidate: (candidate: CandidateResume) => void;
  onDeleteCandidate: (candidateId: string) => void;
  onUpdateCandidateStatus: (candidateId: string, status: CandidateStatus) => void;
  comparisonSelectedIds: string[];
  onToggleCompare: (candidateId: string) => void;
}

export const ScreeningDashboard: React.FC<ScreeningDashboardProps> = ({
  candidates,
  jobs,
  activeJob,
  setActiveJob,
  isBlindMode,
  onOpenUpload,
  onOpenNewJob,
  onSelectCandidate,
  onDeleteCandidate,
  onUpdateCandidateStatus,
  comparisonSelectedIds,
  onToggleCompare
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score-desc' | 'score-asc' | 'exp-desc' | 'name'>('score-desc');

  // Filtered & Sorted Candidates for Active Job
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter(c => c.jobId === activeJob.id)
      .filter(c => {
        if (statusFilter !== 'all' && c.review.status !== statusFilter) return false;
        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase();
        const matchesName = !isBlindMode && c.name.toLowerCase().includes(q);
        const matchesId = c.id.toLowerCase().includes(q);
        const matchesSkill = c.extractedSkills.some(s => s.toLowerCase().includes(q));
        const matchesFile = c.fileName.toLowerCase().includes(q);

        return matchesName || matchesId || matchesSkill || matchesFile;
      })
      .sort((a, b) => {
        if (sortBy === 'score-desc') return b.matchResult.overallScore - a.matchResult.overallScore;
        if (sortBy === 'score-asc') return a.matchResult.overallScore - b.matchResult.overallScore;
        if (sortBy === 'exp-desc') return b.detectedExperienceYears - a.detectedExperienceYears;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [candidates, activeJob.id, statusFilter, searchQuery, sortBy, isBlindMode]);

  // Aggregate Metrics
  const jobCandidates = candidates.filter(c => c.jobId === activeJob.id);
  const totalCount = jobCandidates.length;
  const shortlistedCount = jobCandidates.filter(c => c.review.status === 'Shortlisted').length;
  const interviewCount = jobCandidates.filter(c => c.review.status === 'Interview').length;
  const averageScore = totalCount > 0
    ? Math.round(jobCandidates.reduce((acc, c) => acc + c.matchResult.overallScore, 0) / totalCount)
    : 0;

  return (
    <div className="space-y-6">

      {/* Role Selector & Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Active Screening Role
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <select
                  value={activeJob.id}
                  onChange={(e) => {
                    const found = jobs.find(j => j.id === e.target.value);
                    if (found) setActiveJob(found);
                  }}
                  className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 py-1.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} ({job.department})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={onOpenNewJob}
                className="flex items-center gap-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Job Role</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportCandidatesToCsv(jobCandidates, activeJob, isBlindMode)}
              disabled={jobCandidates.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Resume</span>
            </button>
          </div>
        </div>

        {/* Role Criteria Summary */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="text-slate-500">
              Department: <strong className="text-slate-800 font-medium">{activeJob.department}</strong>
              <span className="mx-2">·</span>
              Required Exp: <strong className="text-slate-800 font-medium">{activeJob.requiredExperienceYears}+ Years</strong>
              <span className="mx-2">·</span>
              Education: <strong className="text-slate-800 font-medium">{activeJob.requiredEducation}</strong>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500">Required Skills:</span>
              {activeJob.requiredSkills.map(skill => (
                <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[11px]">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-slate-400 text-[11px] block">TF-IDF Vectorizer Baseline</span>
            <span className="text-slate-600 font-mono text-xs">Sublinear TF · Cosine Sim</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Total Screened</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{totalCount}</span>
            <span className="text-xs text-slate-400">candidates</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Shortlisted</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-700 tabular-nums">{shortlistedCount}</span>
            <span className="text-xs text-slate-400">profiles</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Interview Stage</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-blue-700 tabular-nums">{interviewCount}</span>
            <span className="text-xs text-slate-400">scheduled</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Avg Match Score</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{averageScore}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by skill, filename, or candidate..."
              className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Filter Tabs & Sort */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
            {['all', 'Shortlisted', 'Interview', 'Under Review', 'Archived'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-lg text-xs py-1 px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="score-desc">Score (High to Low)</option>
              <option value="score-asc">Score (Low to High)</option>
              <option value="exp-desc">Experience (High to Low)</option>
              <option value="name">Candidate Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate Ranking Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">Compare</th>
                <th className="py-3 px-3 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Candidate & File</th>
                <th className="py-3 px-4 text-center">Match Score</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4">Mandatory Skills Matched</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((cand, index) => {
                  const isChecked = comparisonSelectedIds.includes(cand.id);
                  const displayName = isBlindMode
                    ? `Candidate #${String(index + 101).padStart(4, '0')}`
                    : cand.name;
                  const displayContact = isBlindMode ? 'Demographics Redacted' : cand.email;
                  const score = cand.matchResult.overallScore;

                  return (
                    <tr
                      key={cand.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectCandidate(cand)}
                    >
                      {/* Compare Checkbox */}
                      <td
                        className="py-3 px-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCompare(cand.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleCompare(cand.id)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                      </td>

                      {/* Rank */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400 font-semibold">
                        #{index + 1}
                      </td>

                      {/* Candidate & File */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                          {displayName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{displayContact}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-slate-400 truncate max-w-[150px]">{cand.fileName}</span>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-extrabold text-sm tabular-nums text-slate-900">
                            {score}
                            <span className="text-[10px] text-slate-400 font-normal"> /100</span>
                          </span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full ${
                                score >= 75
                                  ? 'bg-emerald-600'
                                  : score >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Experience */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">
                          {cand.detectedExperienceYears} Yrs
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[130px]">
                          {cand.detectedEducation}
                        </span>
                      </td>

                      {/* Matched Skills */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {cand.matchResult.matchedRequiredSkills.slice(0, 3).map(skill => (
                            <span
                              key={skill}
                              className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {cand.matchResult.matchedRequiredSkills.length > 3 && (
                            <span className="text-[10px] text-slate-400 px-1 py-0.5">
                              +{cand.matchResult.matchedRequiredSkills.length - 3} more
                            </span>
                          )}
                          {cand.matchResult.missingRequiredSkills.length > 0 && (
                            <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                              Missing: {cand.matchResult.missingRequiredSkills.length}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pipeline Status */}
                      <td
                        className="py-3 px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={cand.review.status}
                          onChange={(e) => onUpdateCandidateStatus(cand.id, e.target.value as CandidateStatus)}
                          className="text-xs py-1 px-2 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                          <option value="Under Review">Under Review</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interview">Interview</option>
                          <option value="Offered">Offered</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onSelectCandidate(cand)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        >
                          Dossier
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete candidate ${displayName}?`)) {
                              onDeleteCandidate(cand.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Delete Candidate"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium text-slate-700">No candidates match current criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the filter or upload new resumes.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
