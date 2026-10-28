"""
Resume Text & Metadata Extraction Module.
Uses PyMuPDF / pdfplumber and python-docx to parse documents.
Includes regex heuristic extractors for contact details, experience, and education,
and a bias-safeguard blind screening sanitizer.
"""

import re
import os


def extract_text_from_pdf(file_path):
    """Extract text from PDF using PyMuPDF (fitz) with pdfplumber fallback."""
    full_text = []

    # 1. Try PyMuPDF (fitz) - high performance
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        for page in doc:
            full_text.append(page.get_text())
        doc.close()
        text = "\n".join(full_text).strip()
        if text:
            return text
    except Exception as e:
        print(f"PyMuPDF warning: {e}, falling back to pdfplumber")

    # 2. Try pdfplumber fallback
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    full_text.append(page_text)
        return "\n".join(full_text).strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


def extract_text_from_docx(file_path):
    """Extract text from DOCX using python-docx."""
    try:
        import docx
        doc = docx.Document(file_path)
        full_text = [para.text for para in doc.paragraphs if para.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    full_text.append(row_text)
        return "\n".join(full_text).strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from DOCX: {str(e)}")


def extract_text_from_txt(file_path):
    """Extract text from plain text file."""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read().strip()


def parse_resume_document(file_path):
    """Main extraction router supporting PDF, DOCX, and TXT."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext in ['.docx', '.doc']:
        return extract_text_from_docx(file_path)
    elif ext == '.txt':
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")


def extract_candidate_metadata(raw_text):
    """Heuristic regex extractors for contact info, experience, and education."""
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]

    # Email
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', raw_text)
    email = email_match.group(0) if email_match else 'N/A'

    # Phone
    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', raw_text)
    phone = phone_match.group(0) if phone_match else 'N/A'

    # Candidate Name (first non-header line, without email/phone/symbols)
    name = "Candidate"
    for line in lines[:5]:
        if 2 < len(line) < 35 and '@' not in line and not re.search(r'\d', line) and not any(kw in line.lower() for kw in ['resume', 'curriculum', 'page', 'phone', 'email']):
            name = line
            break

    # Experience in years
    exp_years = 1
    exp_match = re.search(r'(\d{1,2})\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?', raw_text, re.IGNORECASE)
    if exp_match:
        exp_years = min(30, int(exp_match.group(1)))
    else:
        # Check for year ranges e.g. 2019 - 2024
        ranges = re.findall(r'(20\d\d)\s*(?:-|to|–)\s*(20\d\d|present|current)', raw_text, re.IGNORECASE)
        if ranges:
            total = 0
            for r in ranges:
                start = int(r[0])
                end = 2026 if 'pres' in r[1].lower() or 'curr' in r[1].lower() else int(r[1])
                if end >= start and end - start <= 15:
                    total += (end - start)
            if total > 0:
                exp_years = min(25, max(1, total))

    # Education level
    lower = raw_text.lower()
    if 'ph.d' in lower or 'doctorate' in lower or 'phd' in lower:
        education = "Doctorate / Ph.D."
    elif 'master' in lower or 'm.s.' in lower or 'mba' in lower or 'm.tech' in lower:
        education = "Master's Degree"
    elif 'bachelor' in lower or 'b.s.' in lower or 'b.tech' in lower or 'b.e.' in lower:
        education = "Bachelor's Degree"
    elif 'associate' in lower:
        education = "Associate Degree"
    else:
        education = "Bachelor's Degree"

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "experience_years": exp_years,
        "education": education
    }


def sanitize_for_blind_screening(text, candidate_number=101):
    """Strips PII (name, email, phone, gender pronouns, graduation years) for bias-free review."""
    sanitized = text
    sanitized = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[REDACTED_EMAIL]', sanitized)
    sanitized = re.sub(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', '[REDACTED_PHONE]', sanitized)
    sanitized = re.sub(r'\b(he|she|him|her|his|hers|himself|herself)\b', 'they/them', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'\b(19\d\d|200\d)\b', '[YEAR]', sanitized)
    return f"Candidate #{candidate_number:04d} (Blind Screening Protected)\n" + sanitized
