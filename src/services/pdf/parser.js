/**
 * Fast PDF parser for banking/SSC mocks (Adda247 style)
 *
 * - Text-only (fast)
 * - Global Q1..Q100 detection
 * - Directions (1-5) linked to questions in range
 * - Robust answer key: S1. Ans.(e) / S1.Ans.(e) / Correct Answer: (e)
 */

import * as pdfjsLib from 'pdfjs-dist'
import { PDFParseError } from '../../utils/errors'
import { EXAM_CONFIGS } from '../../config/exams'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const yieldToUI = () => new Promise((r) => setTimeout(r, 0))

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

function isBoldFont(fontName) {
  if (!fontName) return false
  const n = String(fontName).toLowerCase()
  return (
    n.includes('bold') ||
    n.includes('black') ||
    n.includes('heavy') ||
    n.includes('semibold') ||
    n.includes('demibold')
  )
}

function reconstructPageText(textContent) {
  const items = (textContent.items || []).filter(
    (it) => it && typeof it.str === 'string' && it.str.length > 0
  )
  if (!items.length) return { text: '', lines: [] }

  const styles = textContent.styles || {}
  const enriched = items.map((it) => {
    const t = it.transform || [1, 0, 0, 1, 0, 0]
    const fontKey = it.fontName || it.font || ''
    const style = styles[fontKey] || {}
    const fontName = style.fontFamily || style.fontName || fontKey || ''
    // Bold if font name says so, OR font weight is heavy, OR this glyph is denser (heuristic)
    const bold =
      isBoldFont(fontName) ||
      isBoldFont(fontKey) ||
      (style.fontWeight && Number(style.fontWeight) >= 600)
    return {
      str: it.str,
      x: t[4],
      y: t[5],
      height: Math.abs(t[3]) || Math.abs(it.height) || 10,
      width: it.width || 0,
      bold: !!bold,
    }
  })

  enriched.sort((a, b) => {
    const dy = b.y - a.y
    if (Math.abs(dy) > 2) return dy
    return a.x - b.x
  })

  const lines = []
  let row = []
  let rowY = null
  let rowH = 10

  for (const it of enriched) {
    const thresh = Math.max(it.height, rowH) * 0.5
    if (rowY === null || Math.abs(it.y - rowY) <= thresh) {
      row.push(it)
      rowY = rowY === null ? it.y : (rowY + it.y) / 2
      rowH = it.height
    } else {
      lines.push(mergeRow(row))
      row = [it]
      rowY = it.y
      rowH = it.height
    }
  }
  if (row.length) lines.push(mergeRow(row))
  return { text: lines.join('\n'), lines }
}

/**
 * Merge a row of text items. Bold runs are wrapped in **...** for later rendering.
 */
function mergeRow(items) {
  items.sort((a, b) => a.x - b.x)
  let s = ''
  let inBold = false

  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (i > 0) {
      const prev = items[i - 1]
      const gap = it.x - (prev.x + (prev.width || 0))
      if (gap > (prev.height || 10) * 0.12 && !s.endsWith(' ') && !it.str.startsWith(' ')) {
        // Close bold before space if needed, then reopen
        if (inBold && !it.bold) {
          s += '**'
          inBold = false
        }
        s += ' '
      }
    }

    if (it.bold && !inBold) {
      s += '**'
      inBold = true
    } else if (!it.bold && inBold) {
      s += '**'
      inBold = false
    }
    s += it.str
  }
  if (inBold) s += '**'
  return s.replace(/[ \t]+/g, ' ').replace(/\*\*\s+\*\*/g, ' ').trim()
}

async function extractTextOnly(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer()
  let pdf
  try {
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  } catch (err) {
    if (err?.name === 'PasswordException') {
      throw new PDFParseError('This PDF is password-protected.')
    }
    throw new PDFParseError('Failed to open PDF. File may be corrupted.')
  }

  const numPages = pdf.numPages
  const pages = []
  let totalText = 0

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const { text, lines } = reconstructPageText(content)
    pages.push({ pageNumber: i, text, lines })
    totalText += text.trim().length

    if (onProgress) {
      onProgress(Math.round((i / numPages) * 50), `Reading page ${i} of ${numPages}...`)
    }
    if (i % 3 === 0) await yieldToUI()
  }

  if (totalText < 40) {
    throw new PDFParseError(
      'Very little text found. This may be a scanned PDF. Please use a text-based PDF.'
    )
  }

  return {
    pages,
    numPages,
    fullText: pages.map((p) => p.text).join('\n\n'),
  }
}

// ---------------------------------------------------------------------------
// Exam detection
// ---------------------------------------------------------------------------

function detectExam(fullText) {
  const lower = fullText.toLowerCase()
  if (/sbi\s*clerk/i.test(lower) && /pre/i.test(lower)) return 'sbi-clerk-prelims'
  if (/sbi\s*clerk/i.test(lower) && /main/i.test(lower)) return 'sbi-clerk-mains'
  if (/sbi\s*po/i.test(lower) && /pre/i.test(lower)) return 'sbi-po-prelims'
  if (/sbi\s*po/i.test(lower) && /main/i.test(lower)) return 'sbi-po-mains'
  if (/ibps\s*clerk/i.test(lower) && /pre/i.test(lower)) return 'ibps-clerk-prelims'
  if (/ibps\s*clerk/i.test(lower) && /main/i.test(lower)) return 'ibps-clerk-mains'
  if (/ibps\s*po/i.test(lower) && /pre/i.test(lower)) return 'ibps-po-prelims'
  if (/ibps\s*po/i.test(lower) && /main/i.test(lower)) return 'ibps-po-mains'
  if (/ssc\s*cgl/i.test(lower)) return 'ssc-cgl-tier1'
  for (const exam of EXAM_CONFIGS) {
    if (lower.includes(exam.name.toLowerCase())) return exam.id
  }
  return null
}

// ---------------------------------------------------------------------------
// Directions / passages: "Directions (1-5): ..." → questions 1..5
// ---------------------------------------------------------------------------

function extractDirections(fullText, pages) {
  const passages = []
  // Directions (1-5): or Directions (23-30): or Direction (1-5)
  const re =
    /Directions?\s*\(\s*(\d{1,3})\s*[-–—to]+\s*(\d{1,3})\s*\)\s*[:.]?\s*/gi
  const matches = [...fullText.matchAll(re)]

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const from = parseInt(m[1], 10)
    const to = parseInt(m[2], 10)
    if (from < 1 || to < from || to > 250) continue

    const contentStart = m.index + m[0].length
    // End at next Directions or first question after range, or next big Q marker
    const nextDir = matches[i + 1]?.index ?? fullText.length
    // Also stop before Q{from} if the direction text is short instructions only
    let contentEnd = nextDir
    // Prefer stopping at Q{from} so passage doesn't swallow questions
    const qMarker = new RegExp(
      `(?:^|[\\n\\r])\\s*Q\\.?\\s*${from}\\s*[.)]`,
      'i'
    )
    const qMatch = fullText.slice(contentStart, nextDir).match(qMarker)
    if (qMatch && qMatch.index != null) {
      contentEnd = contentStart + qMatch.index
    }

    let text = fullText.slice(contentStart, contentEnd).trim()
    // Keep a reasonable length; include passage body for RC
    if (text.length > 8000) text = text.slice(0, 8000)

    // Skip tiny/empty
    if (text.length < 10) continue

    const id = `dir-${from}-${to}`
    passages.push({
      id,
      text: `Directions (${from}-${to}): ${text}`,
      from,
      to,
      pageNumber: pageForIndex(pages, m.index),
      imageIds: [],
    })
  }

  return passages
}

function pageForIndex(pages, index) {
  let offset = 0
  for (const page of pages) {
    const len = (page.text || '').length + 2
    if (index < offset + len) return page.pageNumber
    offset += len
  }
  return pages[pages.length - 1]?.pageNumber || null
}

// ---------------------------------------------------------------------------
// Question starts
// ---------------------------------------------------------------------------

function findAllQuestionStarts(fullText) {
  const starts = []
  const reQ = /(?:^|[\n\r])\s*(Q\.?\s*)(\d{1,3})\s*[.)]\s*/gi
  let m
  while ((m = reQ.exec(fullText)) !== null) {
    const number = parseInt(m[2], 10)
    if (!number || number < 1 || number > 250) continue
    const after = fullText.slice(m.index, m.index + 50)
    if (/\bAns\.?\b/i.test(after)) continue
    // Skip solution section "S12." that might look odd
    starts.push({
      number,
      index: m.index,
      contentStart: m.index + m[0].length,
    })
  }

  const foundNums = new Set(starts.map((s) => s.number))
  const rePlain = /(?:^|[\n\r])\s*(\d{1,3})[.)]\s+(?=[A-Za-z(])/g
  while ((m = rePlain.exec(fullText)) !== null) {
    const number = parseInt(m[1], 10)
    if (!number || number < 1 || number > 250) continue
    if (foundNums.has(number)) continue
    const after = fullText.slice(m.index, m.index + 50)
    if (/\bAns\.?\b/i.test(after)) continue
    const before = fullText.slice(Math.max(0, m.index - 2), m.index + 4)
    if (/S\d/i.test(before)) continue
    starts.push({ number, index: m.index, contentStart: m.index + m[0].length })
    foundNums.add(number)
  }

  starts.sort((a, b) => a.index - b.index)
  const byNum = new Map()
  for (const s of starts) {
    if (!byNum.has(s.number)) byNum.set(s.number, s)
  }
  return [...byNum.values()].sort((a, b) => a.index - b.index)
}

function parseOptions(block) {
  let matches = [...block.matchAll(/(?:^|[\n\r])\s*\(([a-eA-E])\)\s+/g)]
  if (matches.length < 2) {
    matches = [...block.matchAll(/(?:^|[\n\r])\s*([a-eA-E])[.)]\s+/g)]
  }
  if (matches.length < 2) {
    matches = [...block.matchAll(/\(([a-eA-E])\)\s+/g)]
  }

  if (matches.length < 2) {
    return { text: block.trim(), options: emptyOptions(), hasOptions: false }
  }

  const qText = block.slice(0, matches[0].index).trim()
  const options = []
  const seen = new Set()

  for (let i = 0; i < matches.length; i++) {
    const label = matches[i][1].toUpperCase()
    if (seen.has(label)) continue
    seen.add(label)
    const start = matches[i].index + matches[i][0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : block.length
    let optText = block.slice(start, end).trim()
    optText = optText
      .split(/(?=\n\s*Q\.?\s*\d|\n\s*Directions?\s*[:(\d]|\n\s*S\d+\.?\s*Ans)/i)[0]
      .trim()
    options.push({ label, text: optText })
  }

  const order = ['A', 'B', 'C', 'D', 'E']
  options.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label))

  return {
    text: qText || block.trim(),
    options: options.length >= 2 ? options : emptyOptions(),
    hasOptions: options.length >= 2,
  }
}

function emptyOptions() {
  return [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
    { label: 'E', text: '' },
  ]
}

function extractQuestions(pages, fullText, passages, onProgress) {
  const warnings = []
  const starts = findAllQuestionStarts(fullText)
  if (onProgress) onProgress(60, `Located ${starts.length} question markers...`)

  const questions = []

  for (let i = 0; i < starts.length; i++) {
    const s = starts[i]
    const end = i + 1 < starts.length ? starts[i + 1].index : fullText.length
    let block = fullText.slice(s.contentStart, end).trim()
    // Don't include following Directions in the question body
    block = block.split(/(?=\n\s*Directions?\s*[:(\d])/i)[0].trim()
    if (!block || block.length < 3) continue

    const { text, options, hasOptions } = parseOptions(block)

    // Link to Directions range
    let sharedContentId = null
    for (const p of passages) {
      if (s.number >= p.from && s.number <= p.to) {
        sharedContentId = p.id
        break
      }
    }

    questions.push({
      number: s.number,
      text: text || block,
      type: 'mcq',
      options,
      hasOptions,
      correctAnswer: null,
      explanation: null,
      sourcePage: pageForIndex(pages, s.index),
      imageIds: [],
      sharedContentId,
    })
  }

  questions.sort((a, b) => a.number - b.number)
  const seen = new Set()
  const unique = []
  for (const q of questions) {
    if (seen.has(q.number)) continue
    seen.add(q.number)
    unique.push(q)
  }

  if (onProgress) onProgress(72, `Extracted ${unique.length} questions...`)

  if (unique.length === 0) {
    warnings.push('No questions detected. Add them manually in the builder.')
  }

  if (unique.length > 2) {
    const nums = unique.map((q) => q.number)
    const min = nums[0]
    const max = nums[nums.length - 1]
    const missing = []
    for (let n = min; n <= max; n++) {
      if (!seen.has(n)) missing.push(n)
    }
    if (missing.length > 0 && missing.length <= 40) {
      warnings.push(`Missing question numbers: ${missing.join(', ')}`)
    }
  }

  const noOpt = unique.filter((q) => !q.hasOptions).length
  if (noOpt > 0) {
    warnings.push(`${noOpt} question(s) missing clear options — blank A–E placeholders added.`)
  }

  const linked = unique.filter((q) => q.sharedContentId).length
  if (linked > 0) {
    warnings.push(`${linked} question(s) linked to Directions/passage panels.`)
  }

  return { questions: unique, warnings }
}

// ---------------------------------------------------------------------------
// Answer key — scan FULL document, multiple patterns
// ---------------------------------------------------------------------------

function extractAnswerKey(pages) {
  const answerKey = {}
  // Solutions often start mid-PDF; scan everything after page 1
  const text = pages.map((p) => p.text).join('\n')

  // Pattern 1: S1. Ans.(e)  S1.Ans.(e)  S1. Ans. (e)  S1 Ans (e)
  const patterns = [
    /S\s*(\d{1,3})\s*\.?\s*Ans\.?\s*\(?\s*([a-eA-E])\s*\)?/gi,
    // S1. (e) at line start in solutions
    /(?:^|[\n\r])\s*S\s*(\d{1,3})\s*\.?\s*\(\s*([a-eA-E])\s*\)/gi,
    // Correct Answer: (e) after Sxx context — handled below per block
  ]

  for (const re of patterns) {
    let m
    const r = new RegExp(re.source, re.flags)
    while ((m = r.exec(text)) !== null) {
      const num = parseInt(m[1], 10)
      const ans = m[2].toUpperCase()
      if (num >= 1 && num <= 300 && !answerKey[num]) {
        answerKey[num] = ans
      }
    }
  }

  // Pattern: blocks "S12. ... Correct Answer: (d)"
  const blockRe = /S\s*(\d{1,3})\s*\.[\s\S]{0,1200}?Correct\s*Answer\s*[:.]?\s*\(?\s*([a-eA-E])\s*\)?/gi
  let m
  while ((m = blockRe.exec(text)) !== null) {
    const num = parseInt(m[1], 10)
    const ans = m[2].toUpperCase()
    if (num >= 1 && num <= 300) {
      // Prefer explicit Ans.(x) already set; else use Correct Answer
      if (!answerKey[num]) answerKey[num] = ans
    }
  }

  return { answerKey, found: Object.keys(answerKey).length > 0 }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function parsePDF(file, { onProgress } = {}) {
  if (onProgress) onProgress(1, 'Opening PDF...')

  const { pages, numPages, fullText } = await extractTextOnly(file, onProgress)

  if (onProgress) onProgress(52, 'Detecting examination...')
  await yieldToUI()
  const detectedExamId = detectExam(fullText)

  if (onProgress) onProgress(55, 'Extracting Directions & passages...')
  await yieldToUI()
  const passages = extractDirections(fullText, pages)

  if (onProgress) onProgress(58, 'Extracting questions...')
  await yieldToUI()
  const { questions, warnings } = extractQuestions(pages, fullText, passages, onProgress)

  if (onProgress) onProgress(82, 'Extracting answer key...')
  await yieldToUI()
  const { answerKey, found: answerKeyFound } = extractAnswerKey(pages)

  let matched = 0
  if (answerKeyFound) {
    for (const q of questions) {
      if (answerKey[q.number]) {
        q.correctAnswer = answerKey[q.number]
        matched++
      }
    }
    warnings.push(`Answer key: ${matched}/${questions.length} answer(s) matched.`)
  } else {
    warnings.push('No answer key detected. Enter answers manually in the builder.')
  }

  const titleMatch =
    fullText.match(/SBI\s+Clerk[^\n]{0,60}/i) ||
    fullText.match(/IBPS\s+(?:Clerk|PO|RRB)[^\n]{0,60}/i) ||
    fullText.match(/SSC\s+CGL[^\n]{0,40}/i)

  if (onProgress) onProgress(100, 'Done')

  return {
    title: titleMatch ? titleMatch[0].trim() : null,
    detectedExamId,
    numPages,
    questions,
    passages,
    images: [],
    warnings,
    answerKeyFound,
    rawPageCount: numPages,
  }
}
