import { JobDescription, CandidateResume } from '../types';
import { extractSkillsFromText, calculateMatch } from './nlpEngine';

export const INITIAL_JOB_DESCRIPTIONS: JobDescription[] = [
  {
    id: 'job-fs-01',
    title: 'Senior Full Stack Engineer',
    department: 'Core Product Engineering',
    requiredExperienceYears: 4,
    requiredEducation: "Bachelor's Degree",
    requiredSkills: ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'REST APIs'],
    preferredSkills: ['AWS', 'CI/CD', 'GraphQL', 'Tailwind CSS', 'Unit Testing'],
    description: `We are looking for an experienced Senior Full Stack Engineer to lead architecture and development of scalable web services and responsive user interfaces. 
The ideal candidate is proficient in React, TypeScript, Node.js, and Python backend services, with strong relational database skills in PostgreSQL and containerized deployments using Docker and AWS.
Responsibilities include writing clean, testable code, optimizing database queries, building RESTful and GraphQL APIs, and collaborating with cross-functional product and DevOps teams in an Agile Scrum environment.`,
    createdAt: '2026-09-15',
    activeCandidatesCount: 5
  },
  {
    id: 'job-ml-02',
    title: 'Machine Learning & AI Engineer',
    department: 'Artificial Intelligence & Research',
    requiredExperienceYears: 3,
    requiredEducation: "Master's Degree",
    requiredSkills: ['Python', 'scikit-learn', 'PyTorch', 'Machine Learning', 'NLP', 'SQL', 'Pandas'],
    preferredSkills: ['Deep Learning', 'Docker', 'FastAPI', 'AWS', 'Computer Vision'],
    description: `Seeking an innovative Machine Learning Engineer to design, train, and deploy production ML models.
You will extract features, train baseline TF-IDF, classification, and neural models using Python, scikit-learn, and PyTorch. 
Experience with NLP text tokenization, embeddings, similarity scoring, vector databases, and RESTful model serving via FastAPI is required.`,
    createdAt: '2026-10-01',
    activeCandidatesCount: 0
  },
  {
    id: 'job-devops-03',
    title: 'Cloud DevOps & SRE Engineer',
    department: 'Infrastructure & Security',
    requiredExperienceYears: 3,
    requiredEducation: "Bachelor's Degree",
    requiredSkills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Linux', 'Git'],
    preferredSkills: ['Python', 'PostgreSQL', 'Redis', 'Agile/Scrum'],
    description: `Join our Cloud Platform team to manage zero-downtime microservices infrastructure on AWS using Kubernetes, Terraform, and Docker.
Key duties include automating CI/CD pipelines, optimizing infrastructure costs, configuring monitoring alerts, and ensuring strict compliance and security practices.`,
    createdAt: '2026-10-10',
    activeCandidatesCount: 0
  },
  {
    id: 'job-fe-04',
    title: 'Associate Frontend Developer',
    department: 'Design Systems & Web',
    requiredExperienceYears: 1,
    requiredEducation: "Bachelor's Degree",
    requiredSkills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Git', 'Tailwind CSS'],
    preferredSkills: ['TypeScript', 'Redux', 'Unit Testing', 'Bootstrap'],
    description: `Entry-to-mid level frontend developer to craft fluid, accessible web interfaces. 
You will collaborate with designers to translate Figma mockups into modular React components using modern CSS, Tailwind, and JavaScript.`,
    createdAt: '2026-10-18',
    activeCandidatesCount: 0
  }
];

export function generateSampleCandidates(activeJob: JobDescription): CandidateResume[] {
  const samples = [
    {
      id: 'cand-001',
      jobId: activeJob.id,
      fileName: 'Sarah_Jenkins_FullStack_Resume.pdf',
      fileSize: 184500,
      fileType: 'pdf' as const,
      uploadedAt: '2026-10-24 09:15 AM',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins.dev@example.com',
      phone: '(415) 555-0192',
      detectedExperienceYears: 6,
      detectedEducation: "Bachelor's Degree",
      rawText: `Sarah Jenkins
San Francisco, CA | sarah.jenkins.dev@example.com | (415) 555-0192 | linkedin.com/in/sarahjenkins

SUMMARY
Senior Full Stack Software Engineer with 6 years of experience building resilient web applications, microservices, and high-volume data pipelines. Deep technical expertise in React, TypeScript, Node.js, Python, PostgreSQL, Docker, and AWS.

EXPERIENCE
Lead Full Stack Engineer | Apex Cloud Technologies | 2021 - Present (5 years)
- Architected enterprise React and TypeScript dashboards serving 150,000 monthly active enterprise users.
- Built scalable backend REST APIs using Node.js, Express, and Python Flask with PostgreSQL database and Redis caching.
- Containerized microservices using Docker and orchestrated automated deployments with AWS ECS and CI/CD GitHub Actions.
- Mentored junior engineers and instituted comprehensive Unit Testing with Jest and PyTest, raising coverage to 88%.

Full Stack Developer | Nexa Digital Labs | 2018 - 2021 (3 years)
- Developed responsive web interfaces using React, Redux, HTML5, CSS3, and Tailwind CSS.
- Designed relational schemas and optimized complex SQL queries in PostgreSQL, reducing query latency by 42%.
- Integrated GraphQL endpoints and external third-party payment gateways.

EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley | 2018

SKILLS
React, TypeScript, Node.js, Python, PostgreSQL, Docker, AWS, REST APIs, CI/CD, Tailwind CSS, GraphQL, Unit Testing, Git, Linux, Agile/Scrum.`,
      review: {
        status: 'Shortlisted' as const,
        reviewerNotes: 'Outstanding senior profile. Complete overlap on core React, TypeScript, Python, and PostgreSQL stack with 6 years verified experience.',
        reviewedBy: 'Alex Morgan (Senior HR)',
        reviewedAt: '2026-10-24 02:40 PM'
      }
    },
    {
      id: 'cand-002',
      jobId: activeJob.id,
      fileName: 'Marcus_Vance_Backend_Lead.docx',
      fileSize: 142100,
      fileType: 'docx' as const,
      uploadedAt: '2026-10-24 11:30 AM',
      name: 'Marcus Vance',
      email: 'm.vance.code@example.com',
      phone: '(206) 555-8831',
      detectedExperienceYears: 5,
      detectedEducation: "Master's Degree",
      rawText: `Marcus Vance
Seattle, WA | m.vance.code@example.com | (206) 555-8831

PROFESSIONAL SUMMARY
Senior Backend Engineer with 5+ years of experience specializing in distributed Python backend architectures, PostgreSQL database design, REST APIs, and Docker container workflows. Solid familiarity with Node.js and cloud infrastructure.

WORK EXPERIENCE
Senior Backend Engineer | DataCore Solutions | 2021 - Present
- Designed high-throughput REST APIs and microservices in Python (Django, FastAPI) handling 12M daily requests.
- Engineered PostgreSQL relational databases, indexing strategies, and SQLite caching layers.
- Standardized container environments with Docker and Linux shell automation for internal engineering teams.
- Collaborated with frontend teams consuming APIs via React and TypeScript interfaces.

Backend Developer | Horizon Cloud Labs | 2019 - 2021
- Maintained RESTful services using Node.js and Python.
- Configured CI/CD pipelines and managed AWS infrastructure.

EDUCATION
Master of Science in Software Engineering | University of Washington | 2019

TECHNICAL SKILLS
Python, Node.js, PostgreSQL, Docker, REST APIs, AWS, Linux, Git, SQL, SQLite, Redis, Microservices, Unit Testing.`,
      review: {
        status: 'Interview' as const,
        reviewerNotes: 'Very strong backend and database performance, though lighter on advanced React/TypeScript state management. Scheduled technical screen.',
        reviewedBy: 'Elena Gomez (Engineering Manager)',
        reviewedAt: '2026-10-25 10:15 AM'
      }
    },
    {
      id: 'cand-003',
      jobId: activeJob.id,
      fileName: 'Elena_Rostova_Resume.pdf',
      fileSize: 201400,
      fileType: 'pdf' as const,
      uploadedAt: '2026-10-25 01:10 PM',
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      phone: '(312) 555-4920',
      detectedExperienceYears: 3,
      detectedEducation: "Bachelor's Degree",
      rawText: `Elena Rostova
Chicago, IL | elena.rostova@example.com | (312) 555-4920

SUMMARY
Full Stack Web Developer with 3 years of hands-on experience building modern, responsive applications with React, TypeScript, Node.js, REST APIs, and Tailwind CSS. Motivated collaborator passionate about clean UI and reliable web services.

PROFESSIONAL EXPERIENCE
Software Developer | BrightSky Interactive | 2023 - Present
- Built user-facing web portals utilizing React, TypeScript, and Tailwind CSS, improving lighthouse accessibility scores to 96.
- Created server-side REST APIs with Node.js and Express; integrated PostgreSQL database with Prisma ORM.
- Used Git and GitHub Actions for continuous deployment and participated in daily Agile Scrum ceremonies.

Junior Web Developer | Catalyst Creative | 2021 - 2023
- Developed landing pages and interactive components using HTML5, CSS3, JavaScript, and Bootstrap.
- Integrated RESTful endpoints and configured unit tests with Jest.

EDUCATION
Bachelor of Science in Information Systems | University of Illinois Urbana-Champaign | 2021

SKILLS
React, TypeScript, Node.js, Express, JavaScript, HTML5, CSS3, Tailwind CSS, PostgreSQL, REST APIs, Git, Unit Testing, Bootstrap.`,
      review: {
        status: 'Under Review' as const,
        reviewerNotes: 'Strong frontend stack with 3 years experience. Solid React/TypeScript skills. Lacks Docker and Python backend experience.',
        reviewedBy: 'Alex Morgan (Senior HR)',
        reviewedAt: '2026-10-25 04:00 PM'
      }
    },
    {
      id: 'cand-004',
      jobId: activeJob.id,
      fileName: 'David_Chen_Resume.txt',
      fileSize: 84200,
      fileType: 'txt' as const,
      uploadedAt: '2026-10-26 10:00 AM',
      name: 'David Chen',
      email: 'david.chen.dev@example.com',
      phone: '(510) 555-3819',
      detectedExperienceYears: 1,
      detectedEducation: "Bachelor's Degree",
      rawText: `David Chen
San Jose, CA | david.chen.dev@example.com | (510) 555-3819

OBJECTIVE
Motivated Junior Web Developer looking to contribute frontend and web development skills in React, JavaScript, and CSS.

EXPERIENCE
Junior Frontend Developer | LaunchPad Studios | 2024 - Present (1 year)
- Developed responsive web pages using HTML5, CSS3, JavaScript, and React.
- Fixed UI bugs and styled components with Tailwind CSS and Bootstrap.
- Participated in code reviews using Git and GitHub.

EDUCATION
Bachelor of Science in Computer Engineering | San Jose State University | 2024

SKILLS
React, JavaScript, HTML5, CSS3, Tailwind CSS, Git, Bootstrap.`,
      review: {
        status: 'Under Review' as const,
        reviewerNotes: 'Junior level. Great candidate for Associate roles, but does not meet 4-year senior threshold for this position.',
        reviewedBy: 'Unassigned',
        reviewedAt: '2026-10-26 11:30 AM'
      }
    },
    {
      id: 'cand-005',
      jobId: activeJob.id,
      fileName: 'Priya_Sharma_Resume.pdf',
      fileSize: 195000,
      fileType: 'pdf' as const,
      uploadedAt: '2026-10-26 03:20 PM',
      name: 'Priya Sharma',
      email: 'priya.sharma.data@example.com',
      phone: '(617) 555-7721',
      detectedExperienceYears: 4,
      detectedEducation: "Master's Degree",
      rawText: `Priya Sharma
Boston, MA | priya.sharma.data@example.com | (617) 555-7721

SUMMARY
Data Analyst & Python Specialist with 4 years of experience analyzing complex datasets, building statistical predictive models, and crafting SQL pipelines.

WORK EXPERIENCE
Data Analyst | Vantage Analytics Corp | 2022 - Present (4 years)
- Developed automated reporting pipelines in Python, Pandas, and NumPy.
- Executed complex SQL analytical queries in PostgreSQL and Snowflake.
- Applied scikit-learn machine learning algorithms for customer segmentation and churn prediction.
- Visualized business intelligence metrics and KPI dashboards.

EDUCATION
Master of Science in Business Analytics | Northeastern University | 2022

SKILLS
Python, SQL, PostgreSQL, Pandas, NumPy, scikit-learn, Machine Learning, Data Analysis, Git.`,
      review: {
        status: 'Archived' as const,
        reviewerNotes: 'Strong data analyst background, but candidate role is software engineering. Missing React, TypeScript, Node.js, and Docker.',
        reviewedBy: 'Alex Morgan (Senior HR)',
        reviewedAt: '2026-10-26 05:15 PM'
      }
    }
  ];

  return samples.map(sample => {
    const skills = extractSkillsFromText(sample.rawText);
    const match = calculateMatch(
      sample.rawText,
      skills,
      sample.detectedExperienceYears,
      sample.detectedEducation,
      activeJob
    );

    return {
      id: sample.id,
      jobId: sample.jobId,
      fileName: sample.fileName,
      fileSize: sample.fileSize,
      fileType: sample.fileType,
      uploadedAt: sample.uploadedAt,
      name: sample.name,
      email: sample.email,
      phone: sample.phone,
      detectedExperienceYears: sample.detectedExperienceYears,
      detectedEducation: sample.detectedEducation,
      extractedSkills: skills,
      matchResult: match,
      review: sample.review,
      rawText: sample.rawText
    };
  });
}
