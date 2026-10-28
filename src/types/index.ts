export interface JobDescription {
  id: string;
  title: string;
  department: string;
  requiredExperienceYears: number;
  requiredEducation: string;
  requiredSkills: string[];
  preferredSkills: string[];
  description: string;
  createdAt: string;
  activeCandidatesCount?: number;
}

export type CandidateStatus = 'Under Review' | 'Shortlisted' | 'Interview' | 'Offered' | 'Archived';

export interface HumanReview {
  status: CandidateStatus;
  manualScoreOverride?: number;
  reviewerNotes: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface CandidateResume {
  id: string;
  jobId: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: 'pdf' | 'docx' | 'txt';
  uploadedAt: string;
  rawText: string;
  
  // Extracted Entities
  name: string;
  email: string;
  phone: string;
  detectedExperienceYears: number;
  detectedEducation: string;
  extractedSkills: string[];

  // Match Results
  matchResult: MatchResult;

  // Human Review & Audit
  review: HumanReview;
}

export interface MatchBreakdown {
  tfidfCosineScore: number;       // 0 - 100
  skillMatchScore: number;        // 0 - 100
  experienceScore: number;        // 0 - 100
  educationScore: number;         // 0 - 100
  weights: {
    tfidf: number;                // 0.40
    skills: number;               // 0.35
    experience: number;           // 0.15
    education: number;            // 0.10
  };
}

export interface MatchResult {
  overallScore: number;           // 0 - 100
  breakdown: MatchBreakdown;
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  additionalSkills: string[];
  topKeyTerms: { term: string; tfidfWeight: number }[];
}

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'running';
  executionTimeMs: number;
  assertion: string;
  details: string;
}
