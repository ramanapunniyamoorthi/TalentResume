import * as mammoth from 'mammoth';

// Interface for parse result
export interface ParsedFileResult {
  text: string;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'docx' | 'txt';
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt'];

export function validateResumeFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).` };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file format (.${extension}). Only PDF, DOCX, and TXT files are supported.`
    };
  }

  return { valid: true };
}

/**
 * Extract text from PDF file in the browser
 */
async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const pdfjsLib = await import('pdfjs-dist');
    // Configure worker
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      fullText += pageStrings.join(' ') + '\n';
    }

    if (fullText.trim().length > 0) {
      return fullText.trim();
    }
  } catch (err) {
    console.warn('PDF.js parsing warning, using fallback buffer scanner:', err);
  }

  // Fallback direct stream text scanner for simple/uncompressed PDF text objects
  const uint8 = new Uint8Array(arrayBuffer);
  const binaryString = new TextDecoder('latin1').decode(uint8);
  const textStreams = binaryString.match(/BT[\s\S]*?ET/g) || [];
  const extractedLines: string[] = [];

  textStreams.forEach(stream => {
    const stringMatches = stream.match(/\((.*?)\)\s*Tj/g) || [];
    stringMatches.forEach(m => {
      const cleaned = m.replace(/^\(/, '').replace(/\)\s*Tj$/, '').trim();
      if (cleaned.length > 0) extractedLines.push(cleaned);
    });
  });

  if (extractedLines.length > 0) {
    return extractedLines.join(' ');
  }

  return `[Extracted from ${file.name}] Candidate resume content could not be rendered as plain text. Please check PDF encoding or upload DOCX/TXT format.`;
}

/**
 * Extract text from DOCX using Mammoth
 */
async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}

/**
 * Main parser entry point handling PDF, DOCX, TXT
 */
export async function parseResumeFile(file: File): Promise<ParsedFileResult> {
  const validation = validateResumeFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const extension = (file.name.split('.').pop()?.toLowerCase() || 'txt') as 'pdf' | 'docx' | 'txt';
  let extractedText = '';

  try {
    if (extension === 'pdf') {
      extractedText = await extractTextFromPdf(file);
    } else if (extension === 'docx') {
      extractedText = await extractTextFromDocx(file);
    } else {
      extractedText = await file.text();
    }

    if (!extractedText || extractedText.trim().length < 20) {
      throw new Error(`The uploaded file "${file.name}" contained insufficient text. Please verify file content.`);
    }

    return {
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
      fileType: extension
    };
  } catch (error: any) {
    return {
      text: '',
      fileName: file.name,
      fileSize: file.size,
      fileType: extension,
      error: error.message || 'Failed to parse file text.'
    };
  }
}
