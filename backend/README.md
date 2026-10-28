# TalentMatch AI: AI-Based Resume Screening & Job Role Matching Platform

An internship engineering project designed for HR teams to automate resume intake, transparent baseline candidate scoring, skill gap identification, and human-in-the-loop candidate management without paid API dependencies or demographic bias.

---

## 1. System Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19 + TypeScript, Tailwind CSS, Lucide Icons | Responsive HR dashboard, candidate ranking, comparison matrix, file dropzone |
| **Backend REST API** | Python 3.10+ & Flask 3.0 | RESTful endpoints, secure file handling, multipart intake |
| **Database** | SQLite 3 (`screening.db`) | Local ACID relational storage for Job Descriptions and Resumes |
| **Document Parsers** | PyMuPDF (`fitz`), `pdfplumber`, `python-docx` | Robust text extraction from multi-page PDF and DOCX files |
| **NLP Baseline Engine** | `scikit-learn` `TfidfVectorizer` + `cosine_similarity` | N-gram tokenization, sublinear TF-IDF weighting, vector cosine similarity |
| **Taxonomy & Extraction** | Regular Expressions + Canonical Skill Ontology | Aliased keyword recognition (e.g., `k8s` -> `Kubernetes`) |

---

## 2. Mathematical Scoring Model (100% Transparent)

To eliminate black-box AI bias, candidate suitability is scored strictly between **0 and 100** using a deterministic linear composite:

$$\text{Final Score} = 0.40 \times S_{\text{TF-IDF}} + 0.35 \times S_{\text{Skills}} + 0.15 \times S_{\text{Experience}} + 0.10 \times S_{\text{Education}}$$

### A. TF-IDF Cosine Similarity ($S_{\text{TF-IDF}}$)
- Evaluates vocabulary overlap between the entire Job Description vector $\vec{J}$ and Resume vector $\vec{R}$:
$$\text{Cosine Similarity} = \frac{\vec{J} \cdot \vec{R}}{\|\vec{J}\|_2 \|\vec{R}\|_2} \times 100$$
- Uses smoothed Inverse Document Frequency: $\text{idf}(t) = \ln\left(\frac{1 + N}{1 + \text{df}(t)}\right) + 1.0$ with sublinear term scaling.

### B. Skills Match ($S_{\text{Skills}}$)
$$S_{\text{Skills}} = \min\left(100, \left(\frac{|\text{Matched Mandatory}|}{|\text{Total Mandatory}|} \times 85\right) + \left(\frac{|\text{Matched Preferred}|}{|\text{Total Preferred}|} \times 15\right)\right)$$

### C. Experience Ratio ($S_{\text{Experience}}$)
- If Candidate Experience $\ge$ Required Experience: **100**
- If Candidate Experience $<$ Required Experience: $\frac{\text{Candidate Exp}}{\text{Required Exp}} \times 80$

### D. Education Alignment ($S_{\text{Education}}$)
- High School (1) < Associate (2) < Bachelor's (3) < Master's (4) < Doctorate (5).
- Candidate Level $\ge$ Required Level: **100**. Level deficit deducted proportionally.

---

## 3. Privacy & Bias Safeguards ("Blind Screening")
- **Protected Characteristics**: Race, gender, age, religion, and sexual orientation are strictly excluded from calculation.
- **Blind Mode Anonymization**: Strips names, phone numbers, email addresses, graduation years, and gender pronouns to mitigate unconscious screening bias.

---

## 4. Windows Setup & Quickstart Guide

### Prerequisites
- Windows 10 or 11
- Python 3.10 or higher installed from [python.org](https://www.python.org/)
- Make sure to check **"Add Python to PATH"** during installation.

### Automated Setup (Recommended)
Double-click `setup_windows.bat` in the `backend/` folder. It will:
1. Create a virtual environment `.venv`
2. Install all dependencies from `requirements.txt`
3. Initialize the SQLite database `screening.db`
4. Run the unit test suite (`test_matcher.py`)
5. Launch the Flask API server at `http://127.0.0.1:5000`

### Manual Setup via PowerShell / Command Prompt
```cmd
cd backend

# 1. Create virtual environment
python -m venv .venv

# 2. Activate virtual environment
# In Command Prompt:
.venv\Scripts\activate.bat
# In PowerShell:
.venv\Scripts\Activate.ps1

# 3. Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Initialize Database
python models.py

# 5. Run Unit Tests
python -m unittest test_matcher.py

# 6. Start Flask Development Server
python app.py
```

The Flask server will be listening at `http://127.0.0.1:5000`.

---

## 5. REST API Endpoints Reference

- `GET /api/health` - Server healthcheck
- `GET /api/jobs` - List all active job postings
- `POST /api/jobs` - Create a new job description
- `POST /api/resumes/upload` - Upload resume (multipart `file` and `job_id`)
- `GET /api/jobs/<job_id>/candidates` - Fetch ranked candidates with scores
- `PATCH /api/candidates/<id>/review` - Update HR review status and notes
- `DELETE /api/candidates/<id>` - Permanently delete candidate and file
- `GET /api/jobs/<job_id>/export-csv` - Download candidate ranking table as CSV
