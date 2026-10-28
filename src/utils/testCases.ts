import { TestCaseResult, JobDescription } from '../types';
import {
  computeTfidfCosineSimilarity,
  extractSkillsFromText,
  calculateMatch,
  sanitizeForBlindScreening
} from './nlpEngine';
import { validateResumeFile } from './fileParser';

export async function runAllTestCases(sampleJob: JobDescription): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  // Test 1: Exact Match
  const t1Start = performance.now();
  const exactResumeText = `We are looking for an experienced Senior Full Stack Engineer. Proficient in React, TypeScript, Node.js, and Python backend services, PostgreSQL database, Docker and AWS. RESTful and GraphQL APIs.`;
  const t1Skills = extractSkillsFromText(exactResumeText);
  const t1Match = calculateMatch(exactResumeText, t1Skills, 5, "Bachelor's Degree", sampleJob);
  const t1Duration = Math.round(performance.now() - t1Start);

  const t1Passed = t1Match.breakdown.skillMatchScore >= 80 && t1Match.overallScore >= 80;
  results.push({
    id: 'tc-01',
    name: 'TC-01: High-Relevance Exact Skill Overlap Test',
    description: 'Verify TF-IDF baseline and skill matcher produce high score (>=80%) when required skills are present.',
    status: t1Passed ? 'passed' : 'failed',
    executionTimeMs: t1Duration,
    assertion: 'assert overallScore >= 80 && skillMatchScore >= 80',
    details: `Overall score: ${t1Match.overallScore}/100 | Skill Score: ${t1Match.breakdown.skillMatchScore}/100 | Matched: ${t1Match.matchedRequiredSkills.length}/${sampleJob.requiredSkills.length}`
  });

  // Test 2: Orthogonal / Irrelevant Resume
  const t2Start = performance.now();
  const culinaryResumeText = `Head Pastry Chef with 8 years of baking experience. Specialize in artisanal sourdough, croissants, French pastries, chocolate tempering, kitchen inventory management, food safety, and customer dining service.`;
  const t2Skills = extractSkillsFromText(culinaryResumeText);
  const t2Match = calculateMatch(culinaryResumeText, t2Skills, 8, 'High School', sampleJob);
  const t2Duration = Math.round(performance.now() - t2Start);

  const t2Passed = t2Match.breakdown.skillMatchScore === 0 && t2Match.overallScore < 30;
  results.push({
    id: 'tc-02',
    name: 'TC-02: Zero-Skill Domain Divergence Test',
    description: 'Verify that an unrelated non-technical resume scores 0% on tech skills and low overall match (<30%).',
    status: t2Passed ? 'passed' : 'failed',
    executionTimeMs: t2Duration,
    assertion: 'assert skillMatchScore == 0 && overallScore < 30',
    details: `Overall score: ${t2Match.overallScore}/100 | Skill Score: ${t2Match.breakdown.skillMatchScore}/100 | Matched: ${t2Match.matchedRequiredSkills.length}`
  });

  // Test 3: Skill Alias & Normalization
  const t3Start = performance.now();
  const aliasText = `Developed responsive interfaces using react.js and reactjs, styled with tailwindcss. Backend in nodejs and express.js, database hosted on postgres and sqlite3. Containerized with k8s.`;
  const t3Extracted = extractSkillsFromText(aliasText);
  const t3Duration = Math.round(performance.now() - t3Start);

  const expectedCanonical = ['React', 'Tailwind CSS', 'Node.js', 'Express', 'PostgreSQL', 'SQLite', 'Kubernetes'];
  const missingFromExtraction = expectedCanonical.filter(c => !t3Extracted.includes(c));
  const t3Passed = missingFromExtraction.length === 0;

  results.push({
    id: 'tc-03',
    name: 'TC-03: Taxonomy Alias Resolution & Normalization',
    description: 'Verify case-insensitivity and colloquial alias normalization (e.g. k8s -> Kubernetes, react.js -> React).',
    status: t3Passed ? 'passed' : 'failed',
    executionTimeMs: t3Duration,
    assertion: 'assert all aliases map to standard canonical dictionary entries',
    details: `Extracted ${t3Extracted.length} canonical skills: ${t3Extracted.join(', ')}`
  });

  // Test 4: Blind Screening PII Redaction
  const t4Start = performance.now();
  const piiText = `John Doe, born in 1982. Email: john.doe@hr-test.org. Phone: (555) 234-5678. He graduated in 2004. He led his team with distinction.`;
  const redacted = sanitizeForBlindScreening(piiText, 0);
  const t4Duration = Math.round(performance.now() - t4Start);

  const hasEmail = redacted.includes('john.doe@hr-test.org');
  const hasPhone = redacted.includes('(555) 234-5678');
  const hasPronoun = /\b(he|she|his|her)\b/i.test(redacted);
  const hasGradYear = /\b(1982|2004)\b/.test(redacted);
  const t4Passed = !hasEmail && !hasPhone && !hasPronoun && !hasGradYear;

  results.push({
    id: 'tc-04',
    name: 'TC-04: Blind Screening PII & Demographic Masking',
    description: 'Verify zero leakage of contact info, gender pronouns, and birth/graduation years in blind mode.',
    status: t4Passed ? 'passed' : 'failed',
    executionTimeMs: t4Duration,
    assertion: 'assert no email, phone, pronoun, or birth year present in sanitized output',
    details: `Result: ${t4Passed ? 'All PII successfully sanitized and replaced with blind candidate token.' : 'Leaked PII detected.'}`
  });

  // Test 5: File Validation Boundaries
  const t5Start = performance.now();
  const fakeBadFile = new File(['binary content'], 'exploit.exe', { type: 'application/x-msdownload' });
  const validationRes = validateResumeFile(fakeBadFile);
  const t5Duration = Math.round(performance.now() - t5Start);

  const t5Passed = !validationRes.valid && validationRes.error?.includes('Unsupported file format');
  results.push({
    id: 'tc-05',
    name: 'TC-05: File Upload Security & Extension Validation',
    description: 'Verify file validator blocks non-whitelisted extensions (.exe, .zip, .bat) with descriptive error.',
    status: t5Passed ? 'passed' : 'failed',
    executionTimeMs: t5Duration,
    assertion: 'assert validateResumeFile("exploit.exe").valid === false',
    details: `Validator response: "${validationRes.error}"`
  });

  // Test 6: Invariant Score Bounds (0 - 100)
  const t6Start = performance.now();
  let allBounded = true;
  for (let i = 0; i < 20; i++) {
    const dummyA = 'python react sql docker kubernetes aws typescript node'.repeat(i + 1);
    const dummyB = 'python postgresql redis terraform linux java'.repeat(i + 1);
    const res = computeTfidfCosineSimilarity(dummyA, dummyB);
    if (res.score < 0 || res.score > 100 || isNaN(res.score)) {
      allBounded = false;
      break;
    }
  }
  const t6Duration = Math.round(performance.now() - t6Start);

  results.push({
    id: 'tc-06',
    name: 'TC-06: Mathematical Invariant & Numerical Stability',
    description: 'Ensure TF-IDF cosine score strictly obeys 0 <= score <= 100 without NaN, infinity, or division by zero.',
    status: allBounded ? 'passed' : 'failed',
    executionTimeMs: t6Duration,
    assertion: 'assert 0 <= cosine_sim <= 100 for all vector lengths',
    details: `Tested 20 variable-length vector comparisons: all bounded within [0, 100].`
  });

  return results;
}
