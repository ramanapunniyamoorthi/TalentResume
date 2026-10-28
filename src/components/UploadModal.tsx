import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { JobDescription, CandidateResume } from '../types';
import { parseResumeFile } from '../utils/fileParser';
import { extractCandidateMetadata, extractSkillsFromText, calculateMatch } from '../utils/nlpEngine';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeJob: JobDescription;
  onCandidateAdded: (candidate: CandidateResume) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  activeJob,
  onCandidateAdded
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [pastedName, setPastedName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processTextAndCreateCandidate = (
    text: string,
    fileName: string,
    fileSize: number,
    fileType: 'pdf' | 'docx' | 'txt'
  ) => {
    try {
      const metadata = extractCandidateMetadata(text);
      if (pastedName.trim() && activeTab === 'paste') {
        metadata.name = pastedName.trim();
      }

      const extractedSkills = extractSkillsFromText(text);
      const matchResult = calculateMatch(
        text,
        extractedSkills,
        metadata.experienceYears,
        metadata.education,
        activeJob
      );

      const newCandidate: CandidateResume = {
        id: `cand-${Date.now().toString(36)}`,
        jobId: activeJob.id,
        fileName,
        fileSize,
        fileType,
        uploadedAt: new Date().toLocaleString([], {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        name: metadata.name,
        email: metadata.email,
        phone: metadata.phone,
        detectedExperienceYears: metadata.experienceYears,
        detectedEducation: metadata.education,
        extractedSkills,
        matchResult,
        review: {
          status: 'Under Review',
          reviewerNotes: '',
          reviewedBy: 'Auto-intake System',
          reviewedAt: new Date().toLocaleDateString()
        },
        rawText: text
      };

      onCandidateAdded(newCandidate);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing resume text.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMessage(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const parsed = await parseResumeFile(file);
      if (parsed.error) {
        setErrorMessage(parsed.error);
        setIsProcessing(false);
        return;
      }
      processTextAndCreateCandidate(parsed.text, parsed.fileName, parsed.fileSize, parsed.fileType);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to read file.');
      setIsProcessing(false);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim() || pastedText.trim().length < 30) {
      setErrorMessage('Please paste at least 30 characters of resume text.');
      return;
    }
    setIsProcessing(true);
    processTextAndCreateCandidate(
      pastedText.trim(),
      `${pastedName ? pastedName.replace(/\s+/g, '_') : 'Pasted'}_Resume.txt`,
      new Blob([pastedText]).size,
      'txt'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Upload Resume for Screening</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluating against: <span className="font-medium text-slate-800">{activeJob.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-100 px-6 pt-3 gap-4">
          <button
            type="button"
            onClick={() => { setActiveTab('upload'); setErrorMessage(null); }}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            File Upload (PDF / DOCX / TXT)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('paste'); setErrorMessage(null); }}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Paste Text Directly
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {activeTab === 'upload' ? (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleFileSelected(e.target.files[0])}
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                />

                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 className="w-8 h-8 text-slate-900 animate-spin mb-3" />
                    <p className="text-sm font-medium text-slate-900">Extracting text & calculating TF-IDF...</p>
                    <p className="text-xs text-slate-500 mt-1">Analyzing skills, experience, and baseline similarity</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5 text-slate-700" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      Drop resume file here, or <span className="text-blue-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports PDF, DOCX, and TXT files up to 10MB
                    </p>
                    <div className="flex items-center gap-3 mt-4 text-xs text-slate-400">
                      <span>✓ PyMuPDF / pdfjs</span>
                      <span>·</span>
                      <span>✓ Mammoth DOCX</span>
                      <span>·</span>
                      <span>✓ Local extraction</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Candidate Name (Optional)
                </label>
                <input
                  type="text"
                  value={pastedName}
                  onChange={(e) => setPastedName(e.target.value)}
                  placeholder="e.g. Jordan Miller (auto-detected if blank)"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Paste Resume Content
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={8}
                  placeholder="Paste work experience, education, skills, and summary here..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !pastedText.trim()}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {isProcessing ? 'Analyzing...' : 'Parse & Calculate Score'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero-paid API usage · Offline & Private</span>
            </span>
            <span className="font-mono text-slate-400">TF-IDF + Cosine Sim</span>
          </div>
        </div>
      </div>
    </div>
  );
};
