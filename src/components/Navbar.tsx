import React from 'react';
import { Eye, EyeOff, Upload, ShieldCheck, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'screening' | 'comparison' | 'jobs' | 'tests' | 'code';
  setActiveTab: (tab: 'screening' | 'comparison' | 'jobs' | 'tests' | 'code') => void;
  isBlindMode: boolean;
  setIsBlindMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenUpload: () => void;
  comparisonCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBlindMode,
  setIsBlindMode,
  onOpenUpload,
  comparisonCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              TM
            </div>
            <div className="whitespace-nowrap">
              <span className="text-base font-bold tracking-tight text-slate-900">TalentMatch AI</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-mono">HR Screening MVP</span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('screening')}
              className={`pb-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'screening'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Candidates & Screening
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`pb-1 border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'comparison'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <span>Candidate Matrix</span>
              {comparisonCount > 0 && (
                <span className="text-xs bg-slate-100 text-slate-800 font-mono px-1.5 py-0.2 rounded">
                  {comparisonCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`pb-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'jobs'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Job Roles
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`pb-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'tests'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Test Suite
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`pb-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'code'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Python Flask Hub
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Blind Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsBlindMode(prev => !prev)}
              title={isBlindMode ? "Disable Blind Screening Mode" : "Enable Blind Screening Mode (Redacts PII to prevent demographic bias)"}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                isBlindMode
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isBlindMode ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isBlindMode ? 'Blind Mode Active' : 'Blind Screening'}</span>
            </button>

            {/* Upload Resume Button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Resume</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs font-medium text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('screening')}
            className={`px-2 py-1 ${activeTab === 'screening' ? 'text-slate-900 font-semibold' : ''}`}
          >
            Screening
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-2 py-1 ${activeTab === 'comparison' ? 'text-slate-900 font-semibold' : ''}`}
          >
            Compare ({comparisonCount})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-2 py-1 ${activeTab === 'jobs' ? 'text-slate-900 font-semibold' : ''}`}
          >
            Job Roles
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-2 py-1 ${activeTab === 'tests' ? 'text-slate-900 font-semibold' : ''}`}
          >
            Tests
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-2 py-1 ${activeTab === 'code' ? 'text-slate-900 font-semibold' : ''}`}
          >
            Python Hub
          </button>
        </div>
      </div>
    </header>
  );
};
