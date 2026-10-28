/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ScreeningDashboard } from './components/ScreeningDashboard';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { CandidateComparison } from './components/CandidateComparison';
import { JobManagement } from './components/JobManagement';
import { TestSuiteView } from './components/TestSuiteView';
import { PythonProjectHub } from './components/PythonProjectHub';
import { UploadModal } from './components/UploadModal';

import { JobDescription, CandidateResume, CandidateStatus } from './types';
import { INITIAL_JOB_DESCRIPTIONS, generateSampleCandidates } from './utils/sampleData';
import { calculateMatch, extractSkillsFromText } from './utils/nlpEngine';

export default function App() {
  const [jobs, setJobs] = useState<JobDescription[]>(INITIAL_JOB_DESCRIPTIONS);
  const [activeJob, setActiveJob] = useState<JobDescription>(INITIAL_JOB_DESCRIPTIONS[0]);
  const [candidates, setCandidates] = useState<CandidateResume[]>(() => 
    generateSampleCandidates(INITIAL_JOB_DESCRIPTIONS[0])
  );

  const [activeTab, setActiveTab] = useState<'screening' | 'comparison' | 'jobs' | 'tests' | 'code'>('screening');
  const [isBlindMode, setIsBlindMode] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isNewJobOpen, setIsNewJobOpen] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResume | null>(null);
  const [comparisonSelectedIds, setComparisonSelectedIds] = useState<string[]>([]);

  // When activeJob changes, if no candidates exist for it, populate or recalculate match scores
  const handleSelectActiveJob = (newJob: JobDescription) => {
    setActiveJob(newJob);
    // Recalculate match scores for all candidates when evaluated against the newly selected job
    setCandidates(prev =>
      prev.map(c => {
        const skills = c.extractedSkills && c.extractedSkills.length > 0 
          ? c.extractedSkills 
          : extractSkillsFromText(c.rawText);
        const matchResult = calculateMatch(
          c.rawText,
          skills,
          c.detectedExperienceYears,
          c.detectedEducation,
          newJob
        );
        return {
          ...c,
          jobId: newJob.id,
          matchResult
        };
      })
    );
  };

  // Add Candidate
  const handleCandidateAdded = (candidate: CandidateResume) => {
    setCandidates(prev => [candidate, ...prev]);
    setSelectedCandidate(candidate);
  };

  // Update Candidate Review Status & Notes
  const handleUpdateReview = (candidateId: string, status: CandidateStatus, notes: string) => {
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          return {
            ...c,
            review: {
              ...c.review,
              status,
              reviewerNotes: notes,
              reviewedBy: 'Alex Morgan (Senior HR)',
              reviewedAt: new Date().toLocaleDateString()
            }
          };
        }
        return c;
      })
    );

    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => prev ? {
        ...prev,
        review: {
          ...prev.review,
          status,
          reviewerNotes: notes,
          reviewedBy: 'Alex Morgan (Senior HR)',
          reviewedAt: new Date().toLocaleDateString()
        }
      } : null);
    }
  };

  // Delete Candidate
  const handleDeleteCandidate = (candidateId: string) => {
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
    setComparisonSelectedIds(prev => prev.filter(id => id !== candidateId));
    if (selectedCandidate?.id === candidateId) {
      setSelectedCandidate(null);
    }
  };

  // Toggle Compare
  const handleToggleCompare = (candidateId: string) => {
    setComparisonSelectedIds(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      }
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 candidates at once.');
        return prev;
      }
      return [...prev, candidateId];
    });
  };

  // Add Job
  const handleAddJob = (newJob: JobDescription) => {
    setJobs(prev => [newJob, ...prev]);
  };

  // Delete Job
  const handleDeleteJob = (jobId: string) => {
    if (jobs.length <= 1) {
      alert('You must retain at least one active job description.');
      return;
    }
    const remaining = jobs.filter(j => j.id !== jobId);
    setJobs(remaining);
    if (activeJob.id === jobId) {
      handleSelectActiveJob(remaining[0]);
    }
  };

  // Candidates count by job
  const candidatesCountByJob = jobs.reduce((acc, job) => {
    acc[job.id] = candidates.filter(c => c.jobId === job.id).length;
    return acc;
  }, {} as { [jobId: string]: number });

  const comparisonCandidates = candidates.filter(c => comparisonSelectedIds.includes(c.id));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      {/* Top Bar Contract Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBlindMode={isBlindMode}
        setIsBlindMode={setIsBlindMode}
        onOpenUpload={() => setIsUploadOpen(true)}
        comparisonCount={comparisonSelectedIds.length}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'screening' && (
          <ScreeningDashboard
            candidates={candidates}
            jobs={jobs}
            activeJob={activeJob}
            setActiveJob={handleSelectActiveJob}
            isBlindMode={isBlindMode}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenNewJob={() => { setActiveTab('jobs'); setIsNewJobOpen(true); }}
            onSelectCandidate={(c) => setSelectedCandidate(c)}
            onDeleteCandidate={handleDeleteCandidate}
            onUpdateCandidateStatus={(id, status) => handleUpdateReview(id, status, '')}
            comparisonSelectedIds={comparisonSelectedIds}
            onToggleCompare={handleToggleCompare}
          />
        )}

        {activeTab === 'comparison' && (
          <CandidateComparison
            candidates={comparisonCandidates}
            allCandidates={candidates.filter(c => c.jobId === activeJob.id)}
            activeJob={activeJob}
            isBlindMode={isBlindMode}
            onRemoveFromCompare={handleToggleCompare}
            onSelectCandidate={(c) => setSelectedCandidate(c)}
            onClearComparison={() => setComparisonSelectedIds([])}
          />
        )}

        {activeTab === 'jobs' && (
          <JobManagement
            jobs={jobs}
            activeJob={activeJob}
            setActiveJob={handleSelectActiveJob}
            onAddJob={handleAddJob}
            onDeleteJob={handleDeleteJob}
            candidatesCountByJob={candidatesCountByJob}
          />
        )}

        {activeTab === 'tests' && (
          <TestSuiteView sampleJob={activeJob} />
        )}

        {activeTab === 'code' && (
          <PythonProjectHub />
        )}
      </main>

      {/* Candidate Dossier Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          activeJob={activeJob}
          isBlindMode={isBlindMode}
          onClose={() => setSelectedCandidate(null)}
          onUpdateReview={handleUpdateReview}
          onDeleteCandidate={handleDeleteCandidate}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        activeJob={activeJob}
        onCandidateAdded={handleCandidateAdded}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">TalentMatch AI</span>
            <span>·</span>
            <span>Scikit-learn TF-IDF Baseline & Cosine Similarity</span>
            <span>·</span>
            <span>Zero Protected-Characteristic Weighting</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Confidential HR Internal Tool</span>
            <span>·</span>
            <span>Flask + SQLite + PyMuPDF Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
