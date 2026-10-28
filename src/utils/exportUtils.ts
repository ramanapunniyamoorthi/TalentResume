import { CandidateResume, JobDescription } from '../types';

/**
 * Clean CSV cell value escaping
 */
function escapeCsv(value: string | number | undefined): string {
  if (value === undefined || value === null) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export Candidate List to CSV
 */
export function exportCandidatesToCsv(candidates: CandidateResume[], job: JobDescription, isBlindMode: boolean) {
  const headers = [
    'Candidate Identifier',
    'Email Address',
    'Phone',
    'Experience (Years)',
    'Education',
    'Overall Match Score (0-100)',
    'TF-IDF Baseline Score',
    'Skill Match Score',
    'Experience Score',
    'Education Score',
    'Matched Required Skills',
    'Missing Required Skills',
    'Additional Skills',
    'HR Pipeline Status',
    'HR Reviewer',
    'Reviewer Notes',
    'Uploaded Timestamp'
  ];

  const rows = candidates.map((cand, idx) => {
    const displayName = isBlindMode ? `Candidate #${String(idx + 101).padStart(4, '0')}` : cand.name;
    const displayEmail = isBlindMode ? '[REDACTED_FOR_PRIVACY]' : cand.email;
    const displayPhone = isBlindMode ? '[REDACTED_FOR_PRIVACY]' : cand.phone;

    return [
      escapeCsv(displayName),
      escapeCsv(displayEmail),
      escapeCsv(displayPhone),
      escapeCsv(cand.detectedExperienceYears),
      escapeCsv(cand.detectedEducation),
      escapeCsv(cand.matchResult.overallScore),
      escapeCsv(cand.matchResult.breakdown.tfidfCosineScore),
      escapeCsv(cand.matchResult.breakdown.skillMatchScore),
      escapeCsv(cand.matchResult.breakdown.experienceScore),
      escapeCsv(cand.matchResult.breakdown.educationScore),
      escapeCsv(cand.matchResult.matchedRequiredSkills.join('; ')),
      escapeCsv(cand.matchResult.missingRequiredSkills.join('; ')),
      escapeCsv(cand.matchResult.additionalSkills.join('; ')),
      escapeCsv(cand.review.status),
      escapeCsv(cand.review.reviewedBy),
      escapeCsv(cand.review.reviewerNotes),
      escapeCsv(cand.uploadedAt)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  const cleanJobTitle = job.title.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `TalentMatch_${cleanJobTitle}_Rankings_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate formatted HTML printable report
 */
export function printCandidateReport(cand: CandidateResume, job: JobDescription, isBlindMode: boolean) {
  const displayName = isBlindMode ? `Candidate #${cand.id}` : cand.name;
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert('Please allow popups to generate printable report.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>HR Screening Report - ${displayName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0 0 6px 0; font-size: 24px; color: #0f172a; }
          .sub { color: #64748b; font-size: 14px; }
          .score-banner { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .score-num { font-size: 38px; font-weight: 700; color: #0f172a; }
          .breakdown-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 12px; }
          .breakdown-item { background: #ffffff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; }
          .breakdown-item span { display: block; font-size: 12px; color: #64748b; }
          .breakdown-item strong { font-size: 18px; color: #0f172a; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 16px; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
          .tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
          .tag { display: inline-block; padding: 4px 10px; font-size: 13px; border-radius: 4px; border: 1px solid #e2e8f0; }
          .tag-matched { background: #f0fdf4; border-color: #bbf7d0; color: #166534; font-weight: 600; }
          .tag-missing { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
          .tag-pref { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
          .raw-text { white-space: pre-wrap; font-family: monospace; font-size: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; max-height: 400px; overflow-y: auto; }
          .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>HR Candidate Screening Dossier</h1>
            <div class="sub">Role Evaluated: <strong>${job.title}</strong> (${job.department})</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; font-weight: 600;">Candidate: ${displayName}</div>
            <div class="sub">Evaluation Date: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="score-banner">
          <div>
            <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Composite Match Score</div>
            <div class="score-num">${cand.matchResult.overallScore} <span style="font-size: 18px; color: #64748b; font-weight: 400;">/ 100</span></div>
            <div style="font-size: 13px; color: #0f172a; font-weight: 500;">Status: <strong>${cand.review.status}</strong></div>
          </div>
          <div style="text-align: right; max-width: 420px; font-size: 12px; color: #475569;">
            Scoring Formula: 40% TF-IDF Cosine Similarity + 35% Hard Skills + 15% Experience + 10% Education Level. Zero demographic or protected-characteristic weighting.
          </div>
        </div>

        <div class="section">
          <div class="section-title">Transparent Score Component Breakdown</div>
          <div class="breakdown-grid">
            <div class="breakdown-item">
              <span>TF-IDF Semantic Match (40%)</span>
              <strong>${cand.matchResult.breakdown.tfidfCosineScore} / 100</strong>
            </div>
            <div class="breakdown-item">
              <span>Skill Overlap Match (35%)</span>
              <strong>${cand.matchResult.breakdown.skillMatchScore} / 100</strong>
            </div>
            <div class="breakdown-item">
              <span>Experience Ratio (15%)</span>
              <strong>${cand.matchResult.breakdown.experienceScore} / 100</strong>
            </div>
            <div class="breakdown-item">
              <span>Education Benchmark (10%)</span>
              <strong>${cand.matchResult.breakdown.educationScore} / 100</strong>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Skills Verification Matrix</div>
          <p style="font-size: 13px; margin: 4px 0 8px 0; font-weight: 600; color: #166534;">Matched Mandatory Skills (${cand.matchResult.matchedRequiredSkills.length} / ${job.requiredSkills.length}):</p>
          <div class="tag-list" style="margin-bottom: 12px;">
            ${cand.matchResult.matchedRequiredSkills.length > 0 ? cand.matchResult.matchedRequiredSkills.map(s => `<span class="tag tag-matched">✓ ${s}</span>`).join('') : '<span style="color: #64748b; font-size: 13px;">None detected</span>'}
          </div>

          <p style="font-size: 13px; margin: 4px 0 8px 0; font-weight: 600; color: #991b1b;">Missing Mandatory Skills (${cand.matchResult.missingRequiredSkills.length}):</p>
          <div class="tag-list" style="margin-bottom: 12px;">
            ${cand.matchResult.missingRequiredSkills.length > 0 ? cand.matchResult.missingRequiredSkills.map(s => `<span class="tag tag-missing">✕ ${s}</span>`).join('') : '<span style="color: #166534; font-size: 13px;">All mandatory skills fulfilled!</span>'}
          </div>

          <p style="font-size: 13px; margin: 4px 0 8px 0; font-weight: 600; color: #1e40af;">Preferred Skills Fulfilled:</p>
          <div class="tag-list">
            ${cand.matchResult.matchedPreferredSkills.length > 0 ? cand.matchResult.matchedPreferredSkills.map(s => `<span class="tag tag-pref">★ ${s}</span>`).join('') : '<span style="color: #64748b; font-size: 13px;">None</span>'}
          </div>
        </div>

        <div class="section">
          <div class="section-title">HR Reviewer Notes & Audit Trail</div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 6px; font-size: 14px;">
            <div><strong>Reviewer:</strong> ${cand.review.reviewedBy}</div>
            <div style="margin-top: 4px;"><strong>Timestamp:</strong> ${cand.review.reviewedAt}</div>
            <div style="margin-top: 8px;"><strong>Feedback:</strong> ${cand.review.reviewerNotes || 'No reviewer comments entered yet.'}</div>
          </div>
        </div>

        <div class="footer">
          <span>TalentMatch AI · HR Screening System · Baseline TF-IDF & Cosine Similarity</span>
          <span>Confidential HR Record</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 350);
}
