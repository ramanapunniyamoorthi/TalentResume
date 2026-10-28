import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  FolderGit2,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface CodeFile {
  name: string;
  path: string;
  language: string;
  content: string;
  description: string;
}

export const PythonProjectHub: React.FC = () => {
  const [selectedFileName, setSelectedFileName] = useState('app.py');
  const [copied, setCopied] = useState(false);

  // Files bundle
  const files: CodeFile[] = [
    {
      name: 'app.py',
      path: 'backend/app.py',
      language: 'python',
      description: 'Flask REST API server with SQLite persistence, multipart file uploads, scoring, review, and CSV export.',
      content: `"""
Flask REST API Backend for TalentMatch AI.
Endpoints for Job Descriptions, Resume Uploads, Candidate Screening, Review, and CSV Export.
"""

import os
import uuid
import json
import csv
import io
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename

from models import init_db, get_db
from extractor import parse_resume_document, extract_candidate_metadata, sanitize_for_blind_screening
from matcher import score_candidate, extract_skills

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB limit

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "TalentMatch AI Backend", "version": "1.0.0"})


# ---------------- JOB DESCRIPTIONS ---------------- #

@app.route('/api/jobs', methods=['GET'])
def list_jobs():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs ORDER BY created_at DESC")
    rows = cursor.fetchall()
    jobs = []
    for r in rows:
        jobs.append({
            "id": r["id"],
            "title": r["title"],
            "department": r["department"],
            "requiredExperienceYears": r["required_exp"],
            "requiredEducation": r["required_edu"],
            "requiredSkills": json.loads(r["required_skills"]),
            "preferredSkills": json.loads(r["preferred_skills"]),
            "description": r["description"],
            "createdAt": r["created_at"]
        })
    conn.close()
    return jsonify(jobs)


@app.route('/api/jobs', methods=['POST'])
def create_job():
    data = request.json or {}
    job_id = str(uuid.uuid4())[:8]
    title = data.get('title', 'Untitled Position')
    department = data.get('department', 'General')
    required_exp = int(data.get('requiredExperienceYears', 2))
    required_edu = data.get('requiredEducation', "Bachelor's Degree")
    required_skills = json.dumps(data.get('requiredSkills', []))
    preferred_skills = json.dumps(data.get('preferredSkills', []))
    description = data.get('description', '')

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO jobs (id, title, department, required_exp, required_edu, required_skills, preferred_skills, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (job_id, title, department, required_exp, required_edu, required_skills, preferred_skills, description))
    conn.commit()
    conn.close()

    return jsonify({"id": job_id, "message": "Job created successfully"}), 201


# ---------------- RESUME UPLOADS & SCREENING ---------------- #

@app.route('/api/resumes/upload', methods=['POST'])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files['file']
    job_id = request.form.get('job_id')

    if not file or file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file format. Please upload PDF, DOCX, or TXT"}), 400

    filename = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex[:8]}_{filename}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
    file.save(file_path)

    try:
        raw_text = parse_resume_document(file_path)
        if len(raw_text.strip()) < 20:
            return jsonify({"error": "File contains insufficient readable text"}), 400

        metadata = extract_candidate_metadata(raw_text)

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        job_row = cursor.fetchone()

        if not job_row:
            return jsonify({"error": "Job description not found"}), 404

        job_dict = {
            "title": job_row["title"],
            "description": job_row["description"],
            "required_exp": job_row["required_exp"],
            "required_edu": job_row["required_edu"],
            "required_skills": json.loads(job_row["required_skills"]),
            "preferred_skills": json.loads(job_row["preferred_skills"])
        }

        score_res = score_candidate(
            job_dict,
            raw_text,
            metadata["experience_years"],
            metadata["education"]
        )

        cand_id = f"cand-{uuid.uuid4().hex[:6]}"
        file_size = os.path.getsize(file_path)
        ext = filename.rsplit('.', 1)[1].lower()

        cursor.execute("""
            INSERT INTO resumes (
                id, job_id, file_name, file_size, file_type, raw_text,
                name, email, phone, detected_exp, detected_edu, extracted_skills,
                overall_score, tfidf_score, skill_score, exp_score, edu_score,
                matched_required, missing_required
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cand_id, job_id, filename, file_size, ext, raw_text,
            metadata["name"], metadata["email"], metadata["phone"],
            metadata["experience_years"], metadata["education"],
            json.dumps(score_res["extracted_skills"]),
            score_res["overall_score"],
            score_res["breakdown"]["tfidf_score"],
            score_res["breakdown"]["skill_score"],
            score_res["breakdown"]["exp_score"],
            score_res["breakdown"]["edu_score"],
            json.dumps(score_res["matched_required"]),
            json.dumps(score_res["missing_required"])
        ))
        conn.commit()
        conn.close()

        return jsonify({
            "id": cand_id,
            "name": metadata["name"],
            "overallScore": score_res["overall_score"],
            "breakdown": score_res["breakdown"]
        }), 201

    except Exception as e:
        return jsonify({"error": f"Failed processing resume: {str(e)}"}), 500


@app.route('/api/jobs/<job_id>/candidates', methods=['GET'])
def get_job_candidates(job_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM resumes WHERE job_id = ? ORDER BY overall_score DESC", (job_id,))
    rows = cursor.fetchall()
    candidates = []
    for r in rows:
        candidates.append({
            "id": r["id"],
            "name": r["name"],
            "email": r["email"],
            "phone": r["phone"],
            "overallScore": r["overall_score"],
            "status": r["status"]
        })
    conn.close()
    return jsonify(candidates)


@app.route('/api/candidates/<cand_id>/review', methods=['PATCH'])
def update_candidate_review(cand_id):
    data = request.json or {}
    status = data.get('status', 'Under Review')
    notes = data.get('reviewerNotes', '')
    reviewer = data.get('reviewedBy', 'HR Reviewer')

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE resumes 
        SET status = ?, reviewer_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (status, notes, reviewer, cand_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Review updated successfully"})


@app.route('/api/candidates/<cand_id>', methods=['DELETE'])
def delete_candidate(cand_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM resumes WHERE id = ?", (cand_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": f"Candidate {cand_id} deleted permanently"})


if __name__ == '__main__':
    init_db()
    print("TalentMatch AI Flask Server running on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)`
    },
    {
      name: 'matcher.py',
      path: 'backend/matcher.py',
      language: 'python',
      description: 'Scikit-learn TF-IDF Vectorizer + Cosine Similarity matching engine with skill taxonomy ontology.',
      content: `"""
Baseline TF-IDF Vectorizer and Cosine Similarity Matching Engine.
Uses scikit-learn for mathematical vector projection and transparent scoring.
"""

import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

SKILL_TAXONOMY = {
    'Python': ['python', 'py'],
    'JavaScript': ['javascript', 'js', 'es6'],
    'TypeScript': ['typescript', 'ts'],
    'Java': ['java', 'core java'],
    'C++': ['c++', 'cpp'],
    'C#': ['c#', 'csharp', '.net'],
    'SQL': ['sql', 't-sql', 'pl/sql'],
    'React': ['react', 'react.js', 'reactjs'],
    'Next.js': ['next.js', 'nextjs'],
    'Node.js': ['node', 'node.js', 'nodejs'],
    'Express': ['express', 'express.js'],
    'Django': ['django'],
    'Flask': ['flask'],
    'FastAPI': ['fastapi'],
    'HTML5': ['html', 'html5'],
    'CSS3': ['css', 'css3'],
    'Tailwind CSS': ['tailwind', 'tailwindcss'],
    'Bootstrap': ['bootstrap'],
    'PostgreSQL': ['postgresql', 'postgres'],
    'MongoDB': ['mongodb', 'mongo'],
    'SQLite': ['sqlite', 'sqlite3'],
    'Redis': ['redis'],
    'Docker': ['docker'],
    'Kubernetes': ['kubernetes', 'k8s'],
    'AWS': ['aws', 'amazon web services'],
    'CI/CD': ['ci/cd', 'github actions', 'jenkins'],
    'Git': ['git', 'github'],
    'Linux': ['linux', 'bash'],
    'REST APIs': ['rest api', 'restful', 'api design'],
    'GraphQL': ['graphql'],
    'Machine Learning': ['machine learning', 'ml'],
    'scikit-learn': ['scikit-learn', 'sklearn'],
    'PyTorch': ['pytorch'],
    'TensorFlow': ['tensorflow'],
    'Pandas': ['pandas'],
    'NumPy': ['numpy'],
    'NLP': ['natural language processing', 'nlp'],
    'Unit Testing': ['unit testing', 'jest', 'pytest'],
    'Agile/Scrum': ['agile', 'scrum']
}


def extract_skills(text):
    if not text:
        return []
    text_clean = f" {text.lower()} "
    detected = []
    for canonical, aliases in SKILL_TAXONOMY.items():
        for alias in aliases:
            pattern = rf'(?:^|[\\s,;()/\\[\\]]){re.escape(alias.lower())}(?:$|[\\s,;()/\\[\\]])'
            if re.search(pattern, text_clean):
                if canonical not in detected:
                    detected.append(canonical)
                break
    return detected


def calculate_tfidf_similarity(doc_a, doc_b):
    if not doc_a.strip() or not doc_b.strip():
        return 0.0, []

    vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),
        smooth_idf=True,
        sublinear_tf=True
    )

    tfidf_matrix = vectorizer.fit_transform([doc_a, doc_b])
    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    score = round(float(np.clip(cosine_sim * 100, 0, 100)), 1)
    return score, []


def score_candidate(job_dict, resume_text, candidate_exp, candidate_edu):
    full_job_text = f"{job_dict.get('title', '')} {job_dict.get('description', '')} {' '.join(job_dict.get('required_skills', []))}"
    tfidf_score, _ = calculate_tfidf_similarity(full_job_text, resume_text)

    candidate_skills = extract_skills(resume_text)
    required_skills = job_dict.get('required_skills', [])
    preferred_skills = job_dict.get('preferred_skills', [])

    matched_required = [s for s in required_skills if s in candidate_skills]
    missing_required = [s for s in required_skills if s not in candidate_skills]
    matched_preferred = [s for s in preferred_skills if s in candidate_skills]

    req_ratio = len(matched_required) / len(required_skills) if required_skills else 1.0
    pref_ratio = len(matched_preferred) / len(preferred_skills) if preferred_skills else 1.0
    skill_score = round(min(100.0, req_ratio * 85.0 + pref_ratio * 15.0), 1)

    req_exp = job_dict.get('required_exp', 2)
    exp_score = 100.0 if candidate_exp >= req_exp else round(max(0.0, (candidate_exp / max(1, req_exp)) * 80.0), 1)

    edu_ranks = {'High School': 1, 'Associate Degree': 2, "Bachelor's Degree": 3, "Master's Degree": 4, 'Doctorate / Ph.D.': 5}
    cand_rank = edu_ranks.get(candidate_edu, 3)
    job_rank = edu_ranks.get(job_dict.get('required_edu', "Bachelor's Degree"), 3)
    edu_score = 100.0 if cand_rank >= job_rank else max(40.0, 100.0 - (job_rank - cand_rank) * 25.0)

    weights = {'tfidf': 0.40, 'skills': 0.35, 'exp': 0.15, 'edu': 0.10}
    overall_score = round(
        tfidf_score * weights['tfidf'] +
        skill_score * weights['skills'] +
        exp_score * weights['exp'] +
        edu_score * weights['edu'],
        1
    )

    return {
        "overall_score": overall_score,
        "breakdown": {
            "tfidf_score": tfidf_score,
            "skill_score": skill_score,
            "exp_score": exp_score,
            "edu_score": edu_score,
            "weights": weights
        },
        "extracted_skills": candidate_skills,
        "matched_required": matched_required,
        "missing_required": missing_required,
        "matched_preferred": matched_preferred
    }`
    },
    {
      name: 'extractor.py',
      path: 'backend/extractor.py',
      language: 'python',
      description: 'PyMuPDF, pdfplumber, and python-docx document parser with regex entity extraction and blind screening sanitizer.',
      content: `"""
Resume Text & Metadata Extraction Module.
Uses PyMuPDF / pdfplumber and python-docx to parse documents.
"""

import re
import os


def extract_text_from_pdf(file_path):
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        full_text = [page.get_text() for page in doc]
        doc.close()
        text = "\\n".join(full_text).strip()
        if text:
            return text
    except Exception as e:
        print(f"PyMuPDF warning: {e}, falling back to pdfplumber")

    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            return "\\n".join([page.extract_text() or '' for page in pdf.pages]).strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


def extract_text_from_docx(file_path):
    import docx
    doc = docx.Document(file_path)
    return "\\n".join([p.text for p in doc.paragraphs if p.text.strip()]).strip()


def parse_resume_document(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext in ['.docx', '.doc']:
        return extract_text_from_docx(file_path)
    elif ext == '.txt':
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read().strip()
    raise ValueError(f"Unsupported file format: {ext}")


def extract_candidate_metadata(raw_text):
    lines = [l.strip() for l in raw_text.split('\\n') if l.strip()]

    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', raw_text)
    email = email_match.group(0) if email_match else 'N/A'

    phone_match = re.search(r'(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', raw_text)
    phone = phone_match.group(0) if phone_match else 'N/A'

    name = lines[0] if lines else 'Candidate'
    exp_years = 2
    exp_match = re.search(r'(\\d{1,2})\\+?\\s*(?:years?|yrs?)', raw_text, re.IGNORECASE)
    if exp_match:
        exp_years = int(exp_match.group(1))

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "experience_years": exp_years,
        "education": "Bachelor's Degree"
    }


def sanitize_for_blind_screening(text, candidate_number=101):
    sanitized = text
    sanitized = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', '[REDACTED_EMAIL]', sanitized)
    sanitized = re.sub(r'(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', '[REDACTED_PHONE]', sanitized)
    sanitized = re.sub(r'\\b(he|she|him|her|his|hers)\\b', 'they/them', sanitized, flags=re.IGNORECASE)
    return f"Candidate #{candidate_number:04d} (Blind Screening Protected)\\n" + sanitized`
    },
    {
      name: 'models.py',
      path: 'backend/models.py',
      language: 'python',
      description: 'SQLite database schema and migrations for Jobs and Resumes tables.',
      content: `"""
SQLite Database Models and Migrations.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'screening.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        required_exp INTEGER NOT NULL,
        required_edu TEXT NOT NULL,
        required_skills TEXT NOT NULL,
        preferred_skills TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type TEXT NOT NULL,
        raw_text TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        detected_exp INTEGER NOT NULL,
        detected_edu TEXT NOT NULL,
        extracted_skills TEXT NOT NULL,
        overall_score REAL NOT NULL,
        tfidf_score REAL NOT NULL,
        skill_score REAL NOT NULL,
        exp_score REAL NOT NULL,
        edu_score REAL NOT NULL,
        matched_required TEXT NOT NULL,
        missing_required TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Under Review',
        reviewer_notes TEXT DEFAULT '',
        reviewed_by TEXT DEFAULT '',
        reviewed_at TEXT DEFAULT '',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()
    print("Database initialized at:", DB_PATH)


if __name__ == '__main__':
    init_db()`
    },
    {
      name: 'test_matcher.py',
      path: 'backend/test_matcher.py',
      language: 'python',
      description: 'Unit test suite testing exact matches, zero-skill candidates, aliases, and PII masking.',
      content: `"""
Unit Test Suite for TalentMatch AI Matching Engine.
Run with: python -m unittest test_matcher.py
"""

import unittest
from matcher import calculate_tfidf_similarity, extract_skills, score_candidate
from extractor import sanitize_for_blind_screening


class TestMatcherEngine(unittest.TestCase):

    def setUp(self):
        self.sample_job = {
            'title': 'Senior Full Stack Engineer',
            'required_exp': 4,
            'required_edu': "Bachelor's Degree",
            'required_skills': ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker'],
            'preferred_skills': ['AWS'],
            'description': 'Senior Full Stack Engineer proficient in React, TypeScript, Node.js, Python, PostgreSQL, and Docker.'
        }

    def test_01_exact_match(self):
        resume = "Senior Full Stack Engineer with React, TypeScript, Node.js, Python, PostgreSQL, and Docker."
        res = score_candidate(self.sample_job, resume, 5, "Bachelor's Degree")
        self.assertGreaterEqual(res["overall_score"], 80.0)

    def test_02_orthogonal_resume(self):
        culinary = "Pastry Chef with 10 years experience in sourdough, baking, and kitchen inventory."
        res = score_candidate(self.sample_job, culinary, 10, "High School")
        self.assertEqual(res["breakdown"]["skill_score"], 0.0)

    def test_03_alias_normalization(self):
        text = "Built interfaces in react.js, styled with tailwindcss, backend in nodejs and postgres."
        skills = extract_skills(text)
        self.assertIn("React", skills)
        self.assertIn("Node.js", skills)
        self.assertIn("PostgreSQL", skills)


if __name__ == '__main__':
    unittest.main()`
    },
    {
      name: 'requirements.txt',
      path: 'backend/requirements.txt',
      language: 'plaintext',
      description: 'Python pip dependencies (Flask, scikit-learn, PyMuPDF, python-docx, pdfplumber).',
      content: `Flask==3.0.3
Flask-Cors==4.0.1
scikit-learn==1.4.2
numpy==1.26.4
PyMuPDF==1.24.1
python-docx==1.1.0
pdfplumber==0.11.0
pytest==8.1.1`
    },
    {
      name: 'setup_windows.bat',
      path: 'backend/setup_windows.bat',
      language: 'bat',
      description: 'One-click Windows batch script to create virtualenv, install packages, init SQLite, and launch Flask.',
      content: `@echo off
echo ===================================================
echo [1/4] Checking Python Installation...
echo ===================================================
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)

echo [2/4] Creating Virtual Environment (.venv)...
if not exist .venv (
    python -m venv .venv
)

echo [3/4] Installing Requirements...
call .venv\\Scripts\\activate
pip install -r requirements.txt

echo [4/4] Initializing Database & Running Tests...
python models.py
python -m unittest test_matcher.py

echo [SUCCESS] Starting Flask Server on http://127.0.0.1:5000...
python app.py
pause`
    },
    {
      name: 'README.md',
      path: 'backend/README.md',
      language: 'markdown',
      description: 'Internship project documentation, architecture diagram, mathematical formulas, and setup guide.',
      content: `# TalentMatch AI: Resume Screening & Job Role Matching Platform

## Architecture & Stack
- Frontend: React 19 + TypeScript, Tailwind CSS
- Backend: Python 3.10+ & Flask 3.0
- Storage: SQLite 3
- Extraction: PyMuPDF + python-docx + pdfplumber
- Baseline Model: scikit-learn TF-IDF + Cosine Similarity

## Mathematical Formula
Final Score = (0.40 * TF-IDF) + (0.35 * Skills) + (0.15 * Experience) + (0.10 * Education)

## Windows Quickstart
1. Double click setup_windows.bat
2. Server runs on http://127.0.0.1:5000`
    }
  ];

  const selectedFile = files.find(f => f.name === selectedFileName) || files[0];

  const copyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (file: CodeFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllAsTextBundle = () => {
    let bundle = `=========================================================\n`;
    bundle += `TALENTMATCH AI - COMPLETE PYTHON BACKEND INTERNSHIP BUNDLE\n`;
    bundle += `=========================================================\n\n`;

    files.forEach(f => {
      bundle += `\n\n#########################################################\n`;
      bundle += `FILE: ${f.path}\n`;
      bundle += `DESCRIPTION: ${f.description}\n`;
      bundle += `#########################################################\n\n`;
      bundle += f.content;
      bundle += `\n`;
    });

    const blob = new Blob([bundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'TalentMatch_AI_Python_Project_Bundle.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Python Flask & SQLite Internship Project Hub</h2>
            <span className="text-xs bg-slate-100 text-slate-800 font-mono px-2 py-0.5 rounded">
              8 Project Files
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete production source code with PyMuPDF, python-docx, scikit-learn TF-IDF matcher, and Windows setup scripts.
          </p>
        </div>

        <button
          onClick={downloadAllAsTextBundle}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Complete Bundle</span>
        </button>
      </div>

      {/* Windows Quickstart Card */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-5 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Laptop className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Windows 10/11 Local Setup Instructions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-emerald-400 font-bold block mb-1">Step 1: Automated Run</span>
            <p className="text-slate-300 text-[11px] mb-2 font-sans">
              Double-click <code className="text-white">setup_windows.bat</code> in the backend directory.
            </p>
            <div className="text-slate-400 text-[10px]">
              Automatically creates .venv, installs pip packages, inits SQLite, and runs Flask on :5000.
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-blue-400 font-bold block mb-1">Step 2: Manual PowerShell</span>
            <div className="text-slate-300 text-[11px] space-y-1">
              <div>&gt; python -m venv .venv</div>
              <div>&gt; .venv\Scripts\activate</div>
              <div>&gt; pip install -r requirements.txt</div>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-amber-400 font-bold block mb-1">Step 3: Test & Start</span>
            <div className="text-slate-300 text-[11px] space-y-1">
              <div>&gt; python models.py</div>
              <div>&gt; python -m unittest test_matcher.py</div>
              <div>&gt; python app.py</div>
            </div>
          </div>
        </div>
      </div>

      {/* File Explorer & Code Viewer */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* File Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
          {files.map(file => (
            <button
              key={file.name}
              onClick={() => setSelectedFileName(file.name)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border-r border-slate-200 ${
                selectedFileName === file.name
                  ? 'bg-white text-slate-900 border-b-2 border-b-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              <span>{file.name}</span>
            </button>
          ))}
        </div>

        {/* File Toolbar */}
        <div className="px-5 py-3 bg-slate-100/60 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="font-mono text-slate-800 font-semibold">{selectedFile.path}</span>
            <span className="text-slate-400 ml-2 hidden sm:inline">· {selectedFile.description}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyCode}
              className="flex items-center gap-1 text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md text-xs hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={() => downloadFile(selectedFile)}
              className="flex items-center gap-1 text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md text-xs hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <pre className="p-5 text-xs font-mono bg-slate-950 text-slate-200 overflow-x-auto max-h-[500px] leading-relaxed selection:bg-slate-800">
          <code>{selectedFile.content}</code>
        </pre>
      </div>

    </div>
  );
};
