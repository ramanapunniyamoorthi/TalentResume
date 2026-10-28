"""
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
    """Detect skills using canonical dictionary and aliases."""
    if not text:
        return []
    text_clean = f" {text.lower()} "
    detected = []
    for canonical, aliases in SKILL_TAXONOMY.items():
        for alias in aliases:
            pattern = rf'(?:^|[\s,;()/\\[\\]]){re.escape(alias.lower())}(?:$|[\s,;()/\\[\\]])'
            if re.search(pattern, text_clean):
                if canonical not in detected:
                    detected.append(canonical)
                break
    return detected


def calculate_tfidf_similarity(doc_a, doc_b):
    """
    Computes baseline TF-IDF cosine similarity between Job Description and Resume.
    Returns score scaled to 0 - 100 and top matching terms.
    """
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

    feature_names = vectorizer.get_feature_names_out()
    vec_a = tfidf_matrix[0].toarray()[0]
    vec_b = tfidf_matrix[1].toarray()[0]
    overlap_terms = []

    for idx, (val_a, val_b) in enumerate(zip(vec_a, vec_b)):
        if val_a > 0 and val_b > 0:
            overlap_terms.append({
                "term": feature_names[idx],
                "weight": round(float(val_a * val_b), 4)
            })

    overlap_terms.sort(key=lambda x: x["weight"], reverse=True)
    return score, overlap_terms[:8]


def score_candidate(job_dict, resume_text, candidate_exp, candidate_edu):
    """
    Transparent 0–100 Weighted HR Matching Model.
    Formula:
    40% TF-IDF Cosine Similarity
    35% Skill Overlap Match
    15% Experience Requirements
    10% Education Requirements
    """
    full_job_text = f"{job_dict.get('title', '')} {job_dict.get('description', '')} {' '.join(job_dict.get('required_skills', []))}"
    tfidf_score, top_terms = calculate_tfidf_similarity(full_job_text, resume_text)

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
    if candidate_exp >= req_exp:
        exp_score = 100.0
    else:
        exp_score = round(max(0.0, (candidate_exp / max(1, req_exp)) * 80.0), 1)

    edu_ranks = {
        'High School': 1,
        'Associate Degree': 2,
        "Bachelor's Degree": 3,
        "Master's Degree": 4,
        'Doctorate / Ph.D.': 5
    }
    cand_rank = edu_ranks.get(candidate_edu, 3)
    job_rank = edu_ranks.get(job_dict.get('required_edu', "Bachelor's Degree"), 3)
    if cand_rank >= job_rank:
        edu_score = 100.0
    else:
        edu_score = max(40.0, 100.0 - (job_rank - cand_rank) * 25.0)

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
        "matched_preferred": matched_preferred,
        "top_terms": top_terms
    }
