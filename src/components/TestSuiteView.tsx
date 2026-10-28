import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, Clock, RotateCw, ShieldCheck, Terminal } from 'lucide-react';
import { TestCaseResult, JobDescription } from '../types';
import { runAllTestCases } from '../utils/testCases';

interface TestSuiteViewProps {
  sampleJob: JobDescription;
}

export const TestSuiteView: React.FC<TestSuiteViewProps> = ({ sampleJob }) => {
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTimestamp, setLastRunTimestamp] = useState<string | null>(null);

  const executeTests = async () => {
    setIsRunning(true);
    try {
      const res = await runAllTestCases(sampleJob);
      setResults(res);
      setLastRunTimestamp(new Date().toLocaleTimeString());
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    executeTests();
  }, [sampleJob.id]);

  const passedCount = results.filter(r => r.status === 'passed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const totalExecutionTime = results.reduce((acc, r) => acc + r.executionTimeMs, 0);

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Automated NLP & Scoring Verification Test Suite</h2>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
              6 Automated Tests
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Validates TF-IDF vectorization, cosine similarity bounds, skill taxonomy resolution, PII anonymization, and file security.
          </p>
        </div>

        <button
          onClick={executeTests}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs self-start sm:self-auto"
        >
          {isRunning ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isRunning ? 'Running Tests...' : 'Re-Run All Tests'}</span>
        </button>
      </div>

      {/* Test Execution Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Total Tests</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums mt-1 block">
            {results.length}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Tests Passed</span>
          <span className="text-2xl font-bold text-emerald-700 tabular-nums mt-1 block">
            {passedCount}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Tests Failed</span>
          <span className={`text-2xl font-bold tabular-nums mt-1 block ${failedCount > 0 ? 'text-red-700' : 'text-slate-400'}`}>
            {failedCount}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Execution Latency</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{totalExecutionTime}</span>
            <span className="text-xs text-slate-400 font-mono">ms</span>
          </div>
        </div>
      </div>

      {/* Test List */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
        {results.map((test) => (
          <div key={test.id} className="p-5 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {test.status === 'passed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{test.name}</h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium uppercase ${
                        test.status === 'passed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {test.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{test.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{test.executionTimeMs} ms</span>
              </div>
            </div>

            {/* Code assertion & details */}
            <div className="mt-3 ml-8 space-y-1.5 bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs font-mono">
              <div className="text-slate-500">
                <span className="text-slate-400">Assertion:</span>{' '}
                <span className="text-slate-800 font-medium">{test.assertion}</span>
              </div>
              <div className="text-slate-600">
                <span className="text-slate-400">Details:</span> {test.details}
              </div>
            </div>
          </div>
        ))}
      </div>

      {lastRunTimestamp && (
        <div className="text-right text-xs text-slate-400">
          Last test run completed at {lastRunTimestamp} · Deterministic baseline verification
        </div>
      )}

    </div>
  );
};
