"""
Unit Test Suite for TalentMatch AI Matching Engine and Extractor.
Run with: python -m unittest test_matcher.py or pytest test_matcher.py
"""

import unittest
from matcher import calculate_tfidf_similarity, extract_skills, score_candidate
from extractor import sanitize_for_blind_screening


class TestMatcherEngine(unittest.TestCase):

    def setUp(self):
        self.sample_job = {
            'title': 'Senior Full Stack Engineer',
            'department': 'Engineering',
            'required_exp': 4,
            'required_edu': "Bachelor's Degree",
            'required_skills': ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker'],
            'preferred_skills': ['AWS', 'CI/CD'],
            'description': 'Senior Full Stack Engineer with React, TypeScript, Node.js, Python, PostgreSQL, and Docker container experience.'
        }

    def test_01_exact_match(self):
        """Test high score when resume perfectly fulfills job requirements."""
        resume = "Senior Full Stack Engineer with 6 years experience in React, TypeScript, Node.js, Python, PostgreSQL, and Docker."
        res = score_candidate(self.sample_job, resume, candidate_exp=6, candidate_edu="Bachelor's Degree")
        self.assertGreaterEqual(res["overall_score"], 80.0)
        self.assertGreaterEqual(res["breakdown"]["skill_score"], 80.0)
        self.assertEqual(len(res["missing_required"]), 0)

    def test_02_orthogonal_resume(self):
        """Test zero skill score for unrelated domain resume."""
        culinary_resume = "Executive Head Chef with 10 years experience in French cuisine, pastry baking, kitchen inventory, and menu design."
        res = score_candidate(self.sample_job, culinary_resume, candidate_exp=10, candidate_edu="High School")
        self.assertEqual(res["breakdown"]["skill_score"], 0.0)
        self.assertLess(res["overall_score"], 35.0)

    def test_03_alias_normalization(self):
        """Test alias recognition (e.g. k8s -> Kubernetes, react.js -> React)."""
        text = "Experienced in react.js, tailwindcss, nodejs, postgres, and k8s."
        skills = extract_skills(text)
        self.assertIn("React", skills)
        self.assertIn("Tailwind CSS", skills)
        self.assertIn("Node.js", skills)
        self.assertIn("PostgreSQL", skills)
        self.assertIn("Kubernetes", skills)

    def test_04_blind_screening_sanitizer(self):
        """Test removal of personal demographic identifiers and contact info."""
        raw = "John Doe, email: john@corp.com, phone: 555-123-4567. He was born in 1990. He graduated in 2012."
        sanitized = sanitize_for_blind_screening(raw, 101)
        self.assertNotIn("john@corp.com", sanitized)
        self.assertNotIn("555-123-4567", sanitized)
        self.assertNotIn("John Doe", sanitized)
        self.assertNotIn("1990", sanitized)
        self.assertNotIn("2012", sanitized)
        self.assertIn("Candidate #0101", sanitized)

    def test_05_score_bounds_invariants(self):
        """Verify scores remain strictly between 0 and 100."""
        score, terms = calculate_tfidf_similarity("", "")
        self.assertEqual(score, 0.0)

        score2, _ = calculate_tfidf_similarity("react python", "react python")
        self.assertGreaterEqual(score2, 90.0)
        self.assertLessEqual(score2, 100.0)


if __name__ == '__main__':
    unittest.main()
