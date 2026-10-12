/**
 * PDF text extraction and basic question parsing using PDF.js.
 * This is a best-effort parser — human review is always required.
 */

import * as pdfjsLib from 'pdfjs-dist'
import { PDFParseError } from '../../utils/errors'
import { EXAM_CONFIGS } from '../../config/exams'

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

/**
 * Extract text content from every page of a PDF.
 */
async function extractTextFromPDF(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer()
  let pdf

  try {
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  } catch (err) {
    if (err?.name === 'PasswordException') {
      throw new PDFParseError('This PDF is password-protected and cannot be processed.')
    }
    throw new PDFParseError('Failed to open PDF. The file may be corrupted.')
  }

  const numPages = pdf.numPages
  const pages = []
  let totalTextLength = 0

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => item.str).join(' ')
    pages.push({ pageNumber: i, text })
    totalTextLength += text.trim().length

    if (onProgress) {
      onProgress(Math.round((i / numPages) * 40), `Reading page ${i} of ${numPages}...`)
    }
  }

  // Detect scanned/image-only PDF
  if (totalTextLength < 50) {
    throw new PDFParseError(
      'This appears to be a scanned (image-only) PDF. Text extraction failed. OCR support can be enabled in a future update. Please use a text-based PDF for now.'
    )
  }

  return { pages, numPages, fullText: pages.map((p) => p.text).join('\n') }
}

/**
 * Attempt to detect examination type from text.
 */
function detectExam(fullText) {
  const lower = fullText.toLowerCase()

  const patterns = [
    { keywords: ['sbi clerk', 'preliminary'], id: 'sbi-clerk-prelims' },
    { keywords: ['sbi clerk', 'main'], id: 'sbi-clerk-mains' },
    { keywords: ['sbi po', 'preliminary'], id: 'sbi-po-prelims' },
    { keywords: ['sbi po', 'main'], id: 'sbi-po-mains' },
    { keywords: ['ibps clerk', 'preliminary'], id: 'ibps-clerk-prelims' },
    { keywords: ['ibps clerk', 'main'], id: 'ibps-clerk-mains' },
    { keywords: ['ibps po', 'preliminary'], id: 'ibps-po-prelims' },
    { keywords: ['ibps po', 'main'], id: 'ibps-po-mains' },
    { keywords: ['ibps rrb', 'clerk', 'preliminary'], id: 'ibps-rrb-clerk-prelims' },
    { keywords: ['ibps rrb', 'clerk', 'main'], id: 'ibps-rrb-clerk-mains' },
    { keywords: ['ibps rrb', 'officer', 'preliminary'], id: 'ibps-rrb-po-prelims' },
    { keywords: ['ibps rrb', 'officer', 'main'], id: 'ibps-rrb-po-mains' },
    { keywords: ['ssc cgl', 'tier-i', 'tier 1', 'tier-1'], id: 'ssc-cgl-tier1' },
    { keywords: ['ssc cgl', 'tier-ii', 'tier 2', 'tier-2'], id: 'ssc-cgl-tier2' },
    { keywords: ['ibps so', 'preliminary'], id: 'ibps-so-prelims' },
    { keywords: ['ibps so', 'it officer', 'professional knowledge'], id: 'ibps-so-mains-it' },
  ]

  for (const pattern of patterns) {
    if (pattern.keywords.every((kw) => lower.includes(kw))) {
      return pattern.id
    }
  }

  // Fallback: match by provider + name only
  for (const exam of EXAM_CONFIGS) {
    const nameLower = exam.name.toLowerCase()
    const stageLower = exam.stage.toLowerCase()
    if (lower.includes(nameLower) && lower.includes(stageLower.split(' ')[0])) {
      return exam.id
    }
  }

  return null
}

/**
 * Extract questions using heuristic pattern matching.
 * Looks for numbered questions and option patterns (A) (B) (C) (D) etc.
 */
function extractQuestions(pages, onProgress) {
  const questions = []
  const warnings = []
  const fullText = pages.map((p) => p.text).join('\n\n')

  // Split by common question number patterns
  // Matches: "1.", "Q.1", "Q1.", "Question 1", "(1)", etc.
  const questionPattern =
    /(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})[.)\]]\s+/gi

  const parts = fullText.split(questionPattern)

  // parts alternates: [preamble, num1, text1, num2, text2, ...]
  if (parts.length < 3) {
    warnings.push(
      'Could not reliably detect question numbering. Please add questions manually or correct extraction.'
    )
    // Try a simpler approach: look for option patterns
    return { questions: [], warnings }
  }

  for (let i = 1; i < parts.length - 1; i += 2) {
    const number = parseInt(parts[i], 10)
    const rawText = (parts[i + 1] || '').trim()

    if (!rawText || rawText.length < 10) continue

    // Extract options
    const { text, options } = parseOptions(rawText)

    questions.push({
      number,
      text: text.trim(),
      type: 'mcq',
      options,
      correctAnswer: null,
      explanation: null,
      sourcePage: null,
    })

    if (onProgress && questions.length % 10 === 0) {
      onProgress(
        40 + Math.min(40, Math.round((questions.length / 100) * 40)),
        `Extracted ${questions.length} questions...`
      )
    }
  }

  // Deduplicate by number (keep first occurrence)
  const seen = new Set()
  const unique = []
  for (const q of questions) {
    if (!seen.has(q.number)) {
      seen.add(q.number)
      unique.push(q)
    }
  }

  if (unique.length === 0) {
    warnings.push('No questions could be extracted automatically.')
  } else if (unique.length < 10) {
    warnings.push(
      `Only ${unique.length} questions were detected. Please verify and add missing questions.`
    )
  }

  // Check for missing numbers
  if (unique.length > 0) {
    const numbers = unique.map((q) => q.number).sort((a, b) => a - b)
    const missing = []
    for (let n = numbers[0]; n <= numbers[numbers.length - 1]; n++) {
      if (!numbers.includes(n)) missing.push(n)
    }
    if (missing.length > 0 && missing.length <= 20) {
      warnings.push(`Missing question numbers: ${missing.join(', ')}`)
    }
  }

  return { questions: unique, warnings }
}

/**
 * Parse options from question text.
 * Supports patterns like: (a) ... (b) ..., A. ... B. ..., 1) ... 2) ...
 */
function parseOptions(rawText) {
  // Try pattern: (A) or (a) or A) or A. or a)
  const optionPattern =
    /(?:^|\s)[\(]?([A-Da-d])[\).]\s+/g

  const matches = [...rawText.matchAll(optionPattern)]

  if (matches.length < 2) {
    // No clear options found
    return { text: rawText, options: [] }
  }

  const options = []
  let questionText = rawText.slice(0, matches[0].index).trim()

  for (let i = 0; i < matches.length; i++) {
    const label = matches[i][1].toUpperCase()
    const start = matches[i].index + matches[i][0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : rawText.length
    const optionText = rawText.slice(start, end).trim()
    // Stop if we hit next question or answer key
    const cleaned = optionText.split(/\n\s*(?:\d+[.)]|Q\.?\s*\d)/)[0].trim()
    options.push({ label, text: cleaned })
  }

  return { text: questionText, options }
}

/**
 * Attempt to extract answer key from the end of the document.
 */
function extractAnswerKey(pages) {
  const answerKey = {}
  const lastPages = pages.slice(-5) // Check last 5 pages
  const text = lastPages.map((p) => p.text).join('\n')

  // Look for answer key heading
  const hasAnswerKey =
    /answer\s*key|answers?\s*:|correct\s*answers?|solutions?/i.test(text)

  if (!hasAnswerKey) return { answerKey, found: false }

  // Pattern: 1. A  or  1-A  or  1) A  or  Q1. A
  const patterns = [
    /(?:Q\.?\s*)?(\d{1,3})\s*[.):\-–]\s*([A-Da-d])/gi,
    /(\d{1,3})\s+([A-Da-d])(?:\s|$)/gi,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const num = parseInt(match[1], 10)
      const ans = match[2].toUpperCase()
      if (num > 0 && num <= 300 && !answerKey[num]) {
        answerKey[num] = ans
      }
    }
  }

  return { answerKey, found: Object.keys(answerKey).length > 0 }
}

/**
 * Main entry point: parse a PDF file into structured question data.
 */
export async function parsePDF(file, { onProgress } = {}) {
  if (onProgress) onProgress(5, 'Opening PDF...')

  const { pages, numPages, fullText } = await extractTextFromPDF(file, onProgress)

  if (onProgress) onProgress(45, 'Detecting examination type...')
  const detectedExamId = detectExam(fullText)

  if (onProgress) onProgress(50, 'Extracting questions...')
  const { questions, warnings } = extractQuestions(pages, onProgress)

  if (onProgress) onProgress(85, 'Looking for answer key...')
  const { answerKey, found: answerKeyFound } = extractAnswerKey(pages)

  // Apply answer key
  if (answerKeyFound) {
    for (const q of questions) {
      if (answerKey[q.number]) {
        q.correctAnswer = answerKey[q.number]
      }
    }
    warnings.push(
      `Answer key detected: ${Object.keys(answerKey).length} answers matched.`
    )
  } else {
    warnings.push('No answer key was detected. You can enter answers manually.')
  }

  // Detect title
  const titleMatch = fullText.match(
    /(?:SBI|IBPS|SSC)\s+(?:Clerk|PO|CGL|RRB|SO)[^\n]{0,40}/i
  )
  const title = titleMatch ? titleMatch[0].trim() : null

  if (onProgress) onProgress(100, 'Done')

  return {
    title,
    detectedExamId,
    numPages,
    questions,
    warnings,
    answerKeyFound,
    rawPageCount: numPages,
  }
}
