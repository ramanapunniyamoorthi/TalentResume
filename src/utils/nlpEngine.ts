import { JobDescription, MatchResult, MatchBreakdown } from '../types';

const ENGLISH_STOP_WORDS = new Set([
  'a', 'about', 'above', 'across', 'after', 'afterwards', 'again', 'against', 'all', 'almost',
  'alone', 'along', 'already', 'also', 'although', 'always', 'am', 'among', 'amongst', 'amoungst',
  'amount', 'an', 'and', 'another', 'any', 'anyhow', 'anyone', 'anything', 'anyway', 'anywhere',
  'are', 'around', 'as', 'at', 'back', 'be', 'became', 'because', 'become', 'becomes',
  'becoming', 'been', 'before', 'beforehand', 'behind', 'being', 'below', 'beside', 'besides',
  'between', 'beyond', 'bill', 'both', 'bottom', 'but', 'by', 'call', 'can', 'cannot', 'cant',
  'co', 'con', 'could', 'couldnt', 'cry', 'de', 'describe', 'detail', 'do', 'done', 'down',
  'due', 'during', 'each', 'eg', 'eight', 'either', 'eleven', 'else', 'elsewhere', 'empty',
  'enough', 'etc', 'even', 'ever', 'every', 'everyone', 'everything', 'everywhere', 'except',
  'few', 'fifteen', 'fifty', 'fill', 'find', 'fire', 'first', 'five', 'for', 'former', 'formerly',
  'forty', 'found', 'four', 'from', 'front', 'full', 'further', 'get', 'give', 'go', 'had',
  'has', 'hasnt', 'have', 'he', 'hence', 'her', 'here', 'hereafter', 'hereby', 'herein',
  'hereupon', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'however', 'hundred', 'i',
  'ie', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'keep', 'last', 'latter', 'latterly',
  'least', 'less', 'ltd', 'made', 'many', 'may', 'me', 'meanwhile', 'might', 'mill', 'mine',
  'more', 'moreover', 'most', 'mostly', 'move', 'much', 'must', 'my', 'myself', 'name',
  'namely', 'neither', 'never', 'nevertheless', 'next', 'nine', 'no', 'nobody', 'none',
  'noone', 'nor', 'not', 'nothing', 'now', 'nowhere', 'of', 'off', 'often', 'on', 'once',
  'one', 'only', 'onto', 'or', 'other', 'others', 'otherwise', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'part', 'per', 'perhaps', 'please', 'put', 'rather', 're', 'same',
  'see', 'seem', 'seemed', 'seeming', 'seems', 'serious', 'several', 'she', 'should', 'show',
  'side', 'since', 'sincere', 'six', 'sixty', 'so', 'some', 'somehow', 'someone', 'something',
  'sometime', 'sometimes', 'somewhere', 'still', 'such', 'system', 'take', 'ten', 'than',
  'that', 'the', 'their', 'them', 'themselves', 'then', 'thence', 'there', 'thereafter',
  'thereby', 'therefore', 'therein', 'thereupon', 'these', 'they', 'thick', 'thin', 'third',
  'this', 'those', 'though', 'three', 'through', 'throughout', 'thru', 'thus', 'to',
  'together', 'too', 'top', 'toward', 'towards', 'twelve', 'twenty', 'two', 'un', 'under',
  'until', 'up', 'upon', 'us', 'very', 'via', 'was', 'we', 'well', 'were', 'what', 'whatever',
  'when', 'whence', 'whenever', 'where', 'whereafter', 'whereas', 'whereby', 'wherein',
  'whereupon', 'wherever', 'whether', 'which', 'while', 'whither', 'who', 'whoever', 'whole',
  'whom', 'whose', 'why', 'will', 'with', 'within', 'without', 'would', 'yet', 'you',
  'your', 'yours', 'yourself', 'yourselves'
]);

export const SKILL_TAXONOMY: { [canonical: string]: string[] } = {
  'Python': ['python', 'py'],
  'JavaScript': ['javascript', 'js', 'es6', 'ecmascript'],
  'TypeScript': ['typescript', 'ts'],
  'Java': ['java', 'core java', 'j2ee'],
  'C++': ['c++', 'cpp'],
  'C#': ['c#', 'csharp', '.net', 'dotnet'],
  'Go': ['golang', 'go language'],
  'Rust': ['rust'],
  'PHP': ['php'],
  'Ruby': ['ruby', 'ruby on rails'],
  'SQL': ['sql', 't-sql', 'pl/sql'],
  'R': ['r language', 'r programming'],

  'React': ['react', 'react.js', 'reactjs'],
  'Next.js': ['next.js', 'nextjs'],
  'Vue.js': ['vue', 'vue.js', 'vuejs'],
  'Angular': ['angular', 'angularjs', 'angular.io'],
  'HTML5': ['html', 'html5'],
  'CSS3': ['css', 'css3', 'scss', 'sass'],
  'Tailwind CSS': ['tailwind', 'tailwindcss'],
  'Redux': ['redux', 'redux toolkit'],
  'Bootstrap': ['bootstrap', 'bootstrap 5', 'bootstrap 4'],

  'Node.js': ['node', 'node.js', 'nodejs'],
  'Express': ['express', 'express.js'],
  'Django': ['django', 'django rest framework'],
  'Flask': ['flask'],
  'FastAPI': ['fastapi'],
  'Spring Boot': ['spring boot', 'spring framework'],
  'GraphQL': ['graphql'],
  'REST APIs': ['rest api', 'restful', 'restful api', 'api design'],

  'Machine Learning': ['machine learning', 'ml'],
  'Deep Learning': ['deep learning', 'dl'],
  'scikit-learn': ['scikit-learn', 'sklearn'],
  'TensorFlow': ['tensorflow', 'tf'],
  'PyTorch': ['pytorch'],
  'Pandas': ['pandas'],
  'NumPy': ['numpy'],
  'NLP': ['natural language processing', 'nlp'],
  'Computer Vision': ['computer vision', 'opencv'],
  'Data Analysis': ['data analysis', 'data analytics', 'eda'],

  'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  'Docker': ['docker', 'containerization'],
  'Kubernetes': ['kubernetes', 'k8s'],
  'CI/CD': ['ci/cd', 'continuous integration', 'github actions', 'jenkins', 'gitlab ci'],
  'Terraform': ['terraform', 'iac'],
  'Linux': ['linux', 'ubuntu', 'bash', 'shell scripting'],
  'Git': ['git', 'github', 'version control'],
  'Azure': ['azure', 'microsoft azure'],
  'GCP': ['gcp', 'google cloud platform', 'google cloud'],

  'PostgreSQL': ['postgresql', 'postgres'],
  'MongoDB': ['mongodb', 'mongo'],
  'MySQL': ['mysql'],
  'Redis': ['redis'],
  'SQLite': ['sqlite', 'sqlite3'],
  'Elasticsearch': ['elasticsearch'],

  'Unit Testing': ['unit testing', 'unit tests', 'jest', 'pytest', 'junit'],
  'Microservices': ['microservices', 'microservice architecture'],
  'Agile/Scrum': ['agile', 'scrum', 'kanban', 'sprint planning'],
  'System Design': ['system design', 'software architecture'],
  'Problem Solving': ['problem solving', 'algorithmic thinking'],
  'Communication': ['communication', 'team collaboration', 'cross-functional']
};

export function tokenizeAndPreprocess(text: string): string[] {
  if (!text) return [];
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s+#.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(w => w.length > 1 && !ENGLISH_STOP_WORDS.has(w));
  const tokens = [...words];
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]} ${words[i + 1]}`);
  }
  return tokens;
}

export function computeTfidfCosineSimilarity(textA: string, textB: string): {
  score: number;
  topTerms: { term: string; tfidfWeight: number }[];
} {
  const tokensA = tokenizeAndPreprocess(textA);
  const tokensB = tokenizeAndPreprocess(textB);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return { score: 0, topTerms: [] };
  }

  const vocab = new Set<string>([...tokensA, ...tokensB]);
  const N = 2;

  const tfA: { [term: string]: number } = {};
  const tfB: { [term: string]: number } = {};

  tokensA.forEach(t => { tfA[t] = (tfA[t] || 0) + 1; });
  tokensB.forEach(t => { tfB[t] = (tfB[t] || 0) + 1; });

  const idf: { [term: string]: number } = {};
  vocab.forEach(term => {
    let df = 0;
    if (tfA[term]) df++;
    if (tfB[term]) df++;
    idf[term] = Math.log((1 + N) / (1 + df)) + 1.0;
  });

  const vecA: { [term: string]: number } = {};
  const vecB: { [term: string]: number } = {};

  let normA = 0;
  let normB = 0;

  vocab.forEach(term => {
    const weightA = ((tfA[term] || 0) / tokensA.length) * idf[term];
    const weightB = ((tfB[term] || 0) / tokensB.length) * idf[term];
    vecA[term] = weightA;
    vecB[term] = weightB;

    normA += weightA * weightA;
    normB += weightB * weightB;
  });

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return { score: 0, topTerms: [] };
  }

  let dotProduct = 0;
  const overlappingTerms: { term: string; tfidfWeight: number }[] = [];

  vocab.forEach(term => {
    const valA = vecA[term] / normA;
    const valB = vecB[term] / normB;
    const termContribution = valA * valB;
    dotProduct += termContribution;

    if (valA > 0 && valB > 0) {
      overlappingTerms.push({
        term,
        tfidfWeight: Number(termContribution.toFixed(4))
      });
    }
  });

  overlappingTerms.sort((a, b) => b.tfidfWeight - a.tfidfWeight);
  const score = Math.min(100, Math.max(0, Number((dotProduct * 100).toFixed(1))));

  return {
    score,
    topTerms: overlappingTerms.slice(0, 8)
  };
}

export function extractSkillsFromText(text: string): string[] {
  if (!text) return [];
  const lowerText = ` ${text.toLowerCase().replace(/[^\w\s+#.-]/g, ' ')} `;
  const matchedSkills: string[] = [];

  for (const [canonical, aliases] of Object.entries(SKILL_TAXONOMY)) {
    const isMatch = aliases.some(alias => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(?:^|[\\s,;()/\\[\\]])${escaped}(?:$|[\\s,;()/\\[\\]])`, 'i');
      return pattern.test(lowerText);
    });

    if (isMatch && !matchedSkills.includes(canonical)) {
      matchedSkills.push(canonical);
    }
  }

  return matchedSkills;
}

export function extractCandidateMetadata(rawText: string): {
  name: string;
  email: string;
  phone: string;
  experienceYears: number;
  education: string;
} {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : 'N/A';

  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : 'N/A';

  let candidateName = 'Unknown Candidate';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (
      line.length > 2 &&
      line.length < 35 &&
      !line.includes('@') &&
      !line.toLowerCase().includes('resume') &&
      !line.toLowerCase().includes('curriculum') &&
      !line.toLowerCase().includes('phone') &&
      !/\d/.test(line)
    ) {
      candidateName = line;
      break;
    }
  }

  let experienceYears = 1;
  const expPattern = /(\d{1,2})\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?/i;
  const expMatch = rawText.match(expPattern);
  if (expMatch && expMatch[1]) {
    experienceYears = Math.min(30, parseInt(expMatch[1], 10));
  } else {
    const yearRanges = [...rawText.matchAll(/(20\d\d)\s*(?:-|to|–)\s*(20\d\d|present|current)/gi)];
    if (yearRanges.length > 0) {
      let totalSpan = 0;
      const currentYear = 2026;
      yearRanges.forEach(match => {
        const start = parseInt(match[1], 10);
        const end = match[2].toLowerCase().includes('pres') || match[2].toLowerCase().includes('curr') 
          ? currentYear 
          : parseInt(match[2], 10);
        if (end >= start && end - start <= 15) {
          totalSpan += (end - start);
        }
      });
      if (totalSpan > 0) {
        experienceYears = Math.min(25, Math.max(1, totalSpan));
      }
    }
  }

  let education = "Bachelor's Degree";
  const lower = rawText.toLowerCase();
  if (lower.includes('ph.d') || lower.includes('phd') || lower.includes('doctorate')) {
    education = 'Doctorate / Ph.D.';
  } else if (lower.includes('master') || lower.includes('m.s.') || lower.includes('ms degree') || lower.includes('mba') || lower.includes('m.tech')) {
    education = "Master's Degree";
  } else if (lower.includes('bachelor') || lower.includes('b.s.') || lower.includes('b.tech') || lower.includes('bs degree') || lower.includes('b.e.')) {
    education = "Bachelor's Degree";
  } else if (lower.includes('associate')) {
    education = "Associate Degree";
  }

  return {
    name: candidateName,
    email,
    phone,
    experienceYears,
    education
  };
}

export function calculateMatch(
  resumeText: string,
  candidateSkills: string[],
  candidateExp: number,
  candidateEdu: string,
  job: JobDescription
): MatchResult {
  const fullJobText = `${job.title} ${job.department} ${job.description} ${job.requiredSkills.join(' ')} ${job.preferredSkills.join(' ')}`;
  const tfidfResult = computeTfidfCosineSimilarity(fullJobText, resumeText);

  const resumeSkillsLower = new Set(candidateSkills.map(s => s.toLowerCase()));
  
  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];

  job.requiredSkills.forEach(req => {
    const isDirectMatch = resumeSkillsLower.has(req.toLowerCase());
    const isAliasMatch = (SKILL_TAXONOMY[req] || []).some(alias => resumeSkillsLower.has(alias.toLowerCase()));
    
    if (isDirectMatch || isAliasMatch) {
      matchedRequired.push(req);
    } else {
      missingRequired.push(req);
    }
  });

  const matchedPreferred: string[] = [];
  job.preferredSkills.forEach(pref => {
    const isDirect = resumeSkillsLower.has(pref.toLowerCase());
    const isAlias = (SKILL_TAXONOMY[pref] || []).some(alias => resumeSkillsLower.has(alias.toLowerCase()));
    if (isDirect || isAlias) {
      matchedPreferred.push(pref);
    }
  });

  const additionalSkills = candidateSkills.filter(
    s => !matchedRequired.includes(s) && !matchedPreferred.includes(s)
  );

  const reqRatio = job.requiredSkills.length > 0 
    ? matchedRequired.length / job.requiredSkills.length 
    : 1.0;
  const prefRatio = job.preferredSkills.length > 0 
    ? matchedPreferred.length / job.preferredSkills.length 
    : 1.0;

  const skillMatchScore = Math.min(100, Math.round((reqRatio * 85 + prefRatio * 15)));

  let experienceScore = 100;
  if (candidateExp < job.requiredExperienceYears) {
    const ratio = candidateExp / Math.max(1, job.requiredExperienceYears);
    experienceScore = Math.round(ratio * 80);
  } else if (candidateExp >= job.requiredExperienceYears) {
    experienceScore = 100;
  }

  let educationScore = 80;
  const eduRanks: { [key: string]: number } = {
    'High School': 1,
    'Associate Degree': 2,
    "Bachelor's Degree": 3,
    "Master's Degree": 4,
    'Doctorate / Ph.D.': 5
  };
  const candRank = eduRanks[candidateEdu] || 3;
  const jobRank = eduRanks[job.requiredEducation] || 3;

  if (candRank >= jobRank) {
    educationScore = 100;
  } else {
    educationScore = Math.max(40, 100 - (jobRank - candRank) * 25);
  }

  const weights = {
    tfidf: 0.40,
    skills: 0.35,
    experience: 0.15,
    education: 0.10
  };

  const rawOverall = 
    tfidfResult.score * weights.tfidf +
    skillMatchScore * weights.skills +
    experienceScore * weights.experience +
    educationScore * weights.education;

  const overallScore = Math.min(100, Math.max(0, Math.round(rawOverall)));

  const breakdown: MatchBreakdown = {
    tfidfCosineScore: tfidfResult.score,
    skillMatchScore,
    experienceScore,
    educationScore,
    weights
  };

  return {
    overallScore,
    breakdown,
    matchedRequiredSkills: matchedRequired,
    missingRequiredSkills: missingRequired,
    matchedPreferredSkills: matchedPreferred,
    additionalSkills,
    topKeyTerms: tfidfResult.topTerms
  };
}

export function sanitizeForBlindScreening(text: string, candidateIndex: number): string {
  let sanitized = text;
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  sanitized = sanitized.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]');
  sanitized = sanitized.replace(/\b(he|she|him|her|his|hers|himself|herself)\b/gi, 'they/them');
  sanitized = sanitized.replace(/\b(19\d\d|200\d)\b/g, '[YEAR]');
  return `Candidate #${String(candidateIndex + 101).padStart(4, '0')} (Blind Screening Mode Active)\n` + sanitized;
}
