"""
SQLite Database Models and Migrations for TalentMatch AI.
Provides table schemas for Job Descriptions and Candidate Resumes.
"""

import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'screening.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Jobs Table
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

    # Resumes Table
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
    print("SQLite database initialized successfully at:", DB_PATH)


if __name__ == '__main__':
    init_db()
