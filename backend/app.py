"""
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
        # Extract Text
        raw_text = parse_resume_document(file_path)
        if len(raw_text.strip()) < 20:
            return jsonify({"error": "File contains insufficient readable text"}), 400

        # Extract Entities
        metadata = extract_candidate_metadata(raw_text)

        # Retrieve Job Requirements
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

        # Calculate TF-IDF & Skill Match
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
            "breakdown": score_res["breakdown"],
            "extractedSkills": score_res["extracted_skills"],
            "matchedRequired": score_res["matched_required"],
            "missingRequired": score_res["missing_required"]
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
            "jobId": r["job_id"],
            "fileName": r["file_name"],
            "fileSize": r["file_size"],
            "fileType": r["file_type"],
            "uploadedAt": r["uploaded_at"],
            "name": r["name"],
            "email": r["email"],
            "phone": r["phone"],
            "detectedExperienceYears": r["detected_exp"],
            "detectedEducation": r["detected_edu"],
            "extractedSkills": json.loads(r["extracted_skills"]),
            "matchResult": {
                "overallScore": r["overall_score"],
                "breakdown": {
                    "tfidfCosineScore": r["tfidf_score"],
                    "skillMatchScore": r["skill_score"],
                    "experienceScore": r["exp_score"],
                    "educationScore": r["edu_score"],
                    "weights": {"tfidf": 0.40, "skills": 0.35, "experience": 0.15, "education": 0.10}
                },
                "matchedRequiredSkills": json.loads(r["matched_required"]),
                "missingRequiredSkills": json.loads(r["missing_required"]),
                "matchedPreferredSkills": [],
                "additionalSkills": [],
                "topKeyTerms": []
            },
            "review": {
                "status": r["status"],
                "reviewerNotes": r["reviewer_notes"],
                "reviewedBy": r["reviewed_by"],
                "reviewedAt": r["reviewed_at"]
            },
            "rawText": r["raw_text"]
        })
    conn.close()
    return jsonify(candidates)


@app.route('/api/candidates/<cand_id>/review', methods=['PATCH'])
def update_candidate_review(cand_id):
    data = request.json or {}
    status = data.get('status', 'Under Review')
    notes = data.get('reviewerNotes', '')
    reviewer = data.get('reviewedBy', 'HR Reviewer')
    reviewed_at = data.get('reviewedAt', '')

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE resumes 
        SET status = ?, reviewer_notes = ?, reviewed_by = ?, reviewed_at = ?
        WHERE id = ?
    """, (status, notes, reviewer, reviewed_at, cand_id))
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


@app.route('/api/jobs/<job_id>/export-csv', methods=['GET'])
def export_csv(job_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM resumes WHERE job_id = ? ORDER BY overall_score DESC", (job_id,))
    rows = cursor.fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Candidate ID", "Name", "Email", "Experience (Years)", "Education",
        "Overall Score", "TF-IDF Score", "Skill Score", "Matched Skills",
        "Missing Skills", "Status", "Reviewer Notes"
    ])

    for r in rows:
        writer.writerow([
            r["id"], r["name"], r["email"], r["detected_exp"], r["detected_edu"],
            r["overall_score"], r["tfidf_score"], r["skill_score"],
            "; ".join(json.loads(r["matched_required"])),
            "; ".join(json.loads(r["missing_required"])),
            r["status"], r["reviewer_notes"]
        ])

    conn.close()
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=candidates_{job_id}.csv"}
    )


if __name__ == '__main__':
    init_db()
    print("TalentMatch AI Flask Server running on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
